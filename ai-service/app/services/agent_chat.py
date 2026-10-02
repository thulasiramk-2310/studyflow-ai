"""Bridge between the chat endpoint and the agent graph.

Maps the final `AgentState` onto the existing `ChatResponse` schema, so the
frontend contract is unchanged by the move from a single LLM call to the graph.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from app.agents.graph import get_default_graph, run_agents
from app.schemas.chat import ChatCitation, ChatResponse

logger = logging.getLogger(__name__)


def state_to_chat_response(state: dict[str, Any]) -> ChatResponse:
    citations = [
        ChatCitation(filename=c["filename"], page=c["page"], score=c["score"])
        for c in state.get("citations", [])
    ]
    return ChatResponse(
        success=True,
        answer=state.get("answer", ""),
        confidence=float(state.get("confidence", 0.0) or 0.0),
        citations=citations,
    )


def run_agent_chat(
    group_id: int,
    query: str,
    user_id: Optional[int] = None,
    history: Optional[list[Any]] = None,
    graph=None,
    audience: str = "student",
) -> ChatResponse:
    """Run one chat turn through the agent graph."""
    state = run_agents(
        group_id=group_id,
        message=query,
        user_id=user_id,
        history=history,
        audience=audience,
        graph=graph or get_default_graph(),
    )

    logger.info(
        "Agent run complete | "
        f"group={group_id} intent={state.get('intent')} steps={state.get('steps')} "
        f"trace={'>'.join(state.get('trace', []))} grounded={state.get('grounded')}"
    )

    return state_to_chat_response(state)
