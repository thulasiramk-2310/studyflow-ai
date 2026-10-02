"""MCP tool definitions and handlers.

The four agents are exposed as tools. Schemas are static data - `GET /mcp/tools`
serves them with no model call, no index and no Groq key.

Every tool is group-scoped, matching the rest of the service: a FAISS index and
a study plan only exist in the context of a group.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Optional

from app.mcp import plan_store
from app.prompts.audience import with_audience
from app.mcp.storage_path import StoragePathError, resolve_storage_key

logger = logging.getLogger(__name__)

READ = "read"
WRITE = "write"

CONFIRM_REQUIRED_ERROR = (
    "create_study_plan is a write tool: call it again with confirm=true to save the plan"
)


class ToolError(Exception):
    """Tool failed in a way the caller should see as a 400."""


TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "name": "index_notes",
        "kind": READ,
        "description": (
            "Index an uploaded PDF into the group's FAISS vector store. "
            "pdf_path must be a relative storage key inside the storage root."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "group_id": {"type": "integer", "description": "Study group that owns the index"},
                "pdf_path": {
                    "type": "string",
                    "description": "Relative storage key, e.g. 'groups/1/notes.pdf'",
                },
                "resource_id": {
                    "type": "integer",
                    "description": "Resource row id in study-service, used to report indexing status",
                },
            },
            "required": ["group_id", "pdf_path", "resource_id"],
            "additionalProperties": False,
        },
    },
    {
        "name": "answer_from_notes",
        "kind": READ,
        "description": (
            "Answer a question strictly from the group's indexed notes. "
            "Returns the answer plus source citations, or a 'not in your notes' reply."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "group_id": {"type": "integer", "description": "Study group to search"},
                "question": {"type": "string", "description": "The student's question"},
            },
            "required": ["group_id", "question"],
            "additionalProperties": False,
        },
    },
    {
        "name": "get_study_plan",
        "kind": READ,
        "description": (
            "Fetch the study plan most recently created for this group and user. "
            "Plans are held in the service process, not persisted in ai_db."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "group_id": {"type": "integer", "description": "Study group the plan belongs to"},
                "user_id": {"type": "integer", "description": "User the plan was created for"},
            },
            "required": ["group_id", "user_id"],
            "additionalProperties": False,
        },
    },
    {
        "name": "create_study_plan",
        "kind": WRITE,
        "description": (
            "Generate a study plan for a group from topics and dates. "
            "Write tool: requires confirm=true, otherwise it refuses and changes nothing."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "group_id": {"type": "integer", "description": "Study group the plan is for"},
                "user_id": {"type": "integer", "description": "User requesting the plan"},
                "topics": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Topics the plan should cover",
                },
                "dates": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Dates or date ranges the plan should span",
                },
                "target_duration": {
                    "type": "integer",
                    "default": 60,
                    "description": "Total session length in minutes",
                },
                "confirm": {
                    "type": "boolean",
                    "default": False,
                    "description": "Must be true to perform the write",
                },
            },
            "required": ["group_id", "user_id", "topics", "dates", "confirm"],
            "additionalProperties": False,
        },
    },
]

TOOL_NAMES = tuple(tool["name"] for tool in TOOL_SCHEMAS)


def list_tools() -> list[dict[str, Any]]:
    """Static tool listing. No model, no index, no credentials."""
    return TOOL_SCHEMAS


# --- handlers ------------------------------------------------------------


def index_notes(
    group_id: int,
    pdf_path: str,
    resource_id: int,
    indexer: Optional[Callable[..., Any]] = None,
) -> dict[str, Any]:
    """Validate the path, then hand off to the existing ingestion pipeline."""
    try:
        key = resolve_storage_key(pdf_path)
    except StoragePathError as exc:
        raise ToolError(str(exc)) from exc

    filename = key.rsplit("/", 1)[-1]

    if indexer is None:
        from app.services.indexing import process_document as indexer  # lazy: pulls PyMuPDF

    indexer(resource_id, group_id, key, filename)

    return {
        "status": "indexed",
        "group_id": group_id,
        "resource_id": resource_id,
        "storage_key": key,
        "filename": filename,
    }


def answer_from_notes(
    group_id: int,
    question: str,
    graph=None,
) -> dict[str, Any]:
    """Answer from the group's notes, through the same guardrails as /chat."""
    from app.agents.graph import get_default_graph, run_agents
    from app.guardrails import GuardrailViolation, guard_input

    try:
        guarded = guard_input(question)
    except GuardrailViolation as violation:
        raise ToolError(violation.message) from violation

    state = run_agents(
        group_id=group_id,
        message=guarded.message,
        graph=graph or get_default_graph(),
    )

    return {
        "answer": state.get("answer", ""),
        "citations": state.get("citations", []),
        "confidence": state.get("confidence", 0.0),
        "grounded": state.get("grounded", False),
    }


def _fetch_group_audience(group_id: int) -> str:
    import requests

    from app.core.config import settings

    res = requests.get(
        f"{settings.STUDY_SERVICE_URL}/groups/{group_id}/internal-audience",
        headers={"X-Internal-Key": settings.INTERNAL_API_KEY},
        timeout=5,
    )
    res.raise_for_status()
    return res.json()["audience"]


def get_study_plan(group_id: int, user_id: int) -> dict[str, Any]:
    plan = plan_store.get_plan(group_id, user_id)
    if plan is None:
        return {"found": False, "plan": None}
    return {"found": True, "plan": plan}


def create_study_plan(
    group_id: int,
    user_id: int,
    topics: list[str],
    dates: list[str],
    confirm: bool = False,
    target_duration: int = 60,
    scheduler: Optional[Callable[..., Any]] = None,
    audience_fetcher: Optional[Callable[[int], str]] = None,
) -> dict[str, Any]:
    """Write tool. Refuses without an explicit confirmation flag."""
    if confirm is not True:
        raise ToolError(CONFIRM_REQUIRED_ERROR)

    # Plans follow the group's stored audience. Never guess when it can't be read.
    fetch = audience_fetcher or _fetch_group_audience
    try:
        audience = fetch(group_id)
    except Exception as e:
        raise ToolError(f"Could not load the group's audience ({type(e).__name__}); try again.") from e

    if scheduler is None:
        from app.agents.retrieval import default_scheduler as scheduler

    context = (
        f"Group {group_id} study plan request.\n"
        f"Topics: {', '.join(topics) if topics else 'none supplied'}\n"
        f"Dates: {', '.join(dates) if dates else 'none supplied'}\n"
        f"Target Duration: {target_duration}"
    )
    context = with_audience(context, audience)

    plan = scheduler(context, target_duration)
    plan_store.save_plan(group_id, user_id, plan)

    return {"created": True, "plan": plan}


HANDLERS: dict[str, Callable[..., Any]] = {
    "index_notes": index_notes,
    "answer_from_notes": answer_from_notes,
    "get_study_plan": get_study_plan,
    "create_study_plan": create_study_plan,
}
