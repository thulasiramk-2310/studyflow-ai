"""LangGraph wiring for the StudyFlow multi-agent system.

    START -> coordinator -> {resource | rag | scheduler} -> halt -> END
                  ^                      |
                  +----------------------+   (only while intents remain)

The coordinator is the entry node and the only router. Agent nodes never call
each other directly. Every node increments `steps`; both conditional edges
check it against MAX_STEPS, so a request can never execute more than 6 nodes
regardless of what the agents decide.

All collaborators are injectable, so the graph is importable and runnable with
no Groq key, no FAISS index and no network.
"""

from __future__ import annotations

import logging
from functools import partial
from typing import Any, Optional

from langgraph.graph import END, START, StateGraph

from app.agents.nodes import (
    coordinator_node,
    rag_node,
    resource_node,
    route_after_agent,
    route_from_coordinator,
    scheduler_node,
)
from app.agents.retrieval import default_index_lister, default_retriever, default_scheduler
from app.agents.state import MAX_STEPS, AgentState, new_state

logger = logging.getLogger(__name__)


def halt_node(state: AgentState) -> dict[str, Any]:
    """Terminal node. Marks the run finished without consuming a step."""
    return {"halted": True}


def build_graph(
    provider=None,
    retriever=None,
    index_lister=None,
    scheduler=None,
):
    """Compile the agent graph.

    Passing nothing wires the production collaborators lazily; tests pass stubs.
    """
    if provider is None:
        from app.llm.provider import get_provider

        provider = get_provider()
    retriever = retriever or default_retriever
    index_lister = index_lister or default_index_lister
    scheduler = scheduler or default_scheduler

    graph = StateGraph(AgentState)

    graph.add_node("coordinator", partial(coordinator_node, provider=provider))
    graph.add_node("resource", partial(resource_node, index_lister=index_lister))
    graph.add_node("rag", partial(rag_node, provider=provider, retriever=retriever))
    graph.add_node("scheduler", partial(scheduler_node, scheduler=scheduler))
    graph.add_node("halt", halt_node)

    graph.add_edge(START, "coordinator")
    graph.add_conditional_edges(
        "coordinator",
        route_from_coordinator,
        {"resource": "resource", "rag": "rag", "scheduler": "scheduler", "halt": "halt"},
    )
    for agent in ("resource", "rag", "scheduler"):
        graph.add_conditional_edges(
            agent,
            route_after_agent,
            {"coordinator": "coordinator", "halt": "halt"},
        )
    graph.add_edge("halt", END)

    return graph.compile()


_default_graph = None


def get_default_graph():
    """Process-wide compiled graph with production collaborators.

    Compiling per request would rebuild the graph on every chat message, so the
    result is cached. `reset_default_graph()` clears it for tests.
    """
    global _default_graph
    if _default_graph is None:
        _default_graph = build_graph()
    return _default_graph


def set_default_graph(graph) -> None:
    """Install a prebuilt graph as the process default (tests, evals)."""
    global _default_graph
    _default_graph = graph


def reset_default_graph() -> None:
    global _default_graph
    _default_graph = None


def run_agents(
    group_id: int,
    message: str,
    user_id: Optional[int] = None,
    history: Optional[list[Any]] = None,
    context: str = "",
    target_duration: int = 60,
    graph=None,
    **build_kwargs,
) -> AgentState:
    """Run one request through the graph and return the final state."""
    compiled = graph or build_graph(**build_kwargs)
    state = new_state(
        group_id=group_id,
        message=message,
        user_id=user_id,
        history=history,
        context=context,
        target_duration=target_duration,
    )
    # recursion_limit is a second belt on top of the step counter: it bounds
    # LangGraph's own super-step count if a routing bug ever creates a cycle.
    result = compiled.invoke(state, config={"recursion_limit": MAX_STEPS * 2 + 2})
    return result
