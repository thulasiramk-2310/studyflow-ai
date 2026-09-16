"""Shared state for the StudyFlow agent graph."""

from __future__ import annotations

from typing import Any, Literal, Optional, TypedDict

# Hard cap on node executions per request. The graph halts once `steps` reaches
# this value, whatever the agents want to do next.
MAX_STEPS = 6

Intent = Literal["resource", "rag", "scheduler", "clarify"]

ROUTABLE_INTENTS: tuple[str, ...] = ("resource", "rag", "scheduler")


class AgentState(TypedDict, total=False):
    """State passed between nodes.

    Only `group_id` and `message` are required on input. Everything else is
    filled in by the nodes.
    """

    # --- input ---
    group_id: int
    user_id: Optional[int]
    message: str
    history: list[Any]
    resource_ids: list[int]
    target_duration: int
    context: str

    # --- routing ---
    intent: str
    pending_intents: list[str]
    steps: int
    halted: bool
    trace: list[str]

    # --- output ---
    answer: str
    citations: list[dict]
    confidence: float
    needs_clarification: bool
    plan: Optional[dict]
    documents: list[dict]
    # Chunks the RAGAgent actually used, after PII masking.
    retrieved_chunks: list[str]
    # Whether the grounding guardrail found support for the answer.
    grounded: bool


def new_state(
    group_id: int,
    message: str,
    user_id: Optional[int] = None,
    history: Optional[list[Any]] = None,
    resource_ids: Optional[list[int]] = None,
    target_duration: int = 60,
    context: str = "",
) -> AgentState:
    """Build a fresh state with every field initialised."""
    return AgentState(
        group_id=group_id,
        user_id=user_id,
        message=message,
        history=history or [],
        resource_ids=resource_ids or [],
        target_duration=target_duration,
        context=context,
        intent="",
        pending_intents=[],
        steps=0,
        halted=False,
        trace=[],
        answer="",
        citations=[],
        confidence=0.0,
        needs_clarification=False,
        plan=None,
        documents=[],
        retrieved_chunks=[],
        grounded=False,
    )
