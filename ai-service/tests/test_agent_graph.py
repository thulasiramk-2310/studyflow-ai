"""End-to-end graph behaviour, with no Groq key and no FAISS index."""

from __future__ import annotations

import pytest

from app.agents.graph import build_graph, run_agents
from app.agents.nodes import NO_INDEX_MESSAGE
from app.agents.state import MAX_STEPS, new_state
from app.llm.provider import MockProvider
from app.prompts.agent_prompt import NOT_IN_NOTES

PLAN = {"title": "Paging revision", "duration_minutes": 60, "confidence": 0.7}


@pytest.fixture
def graph(stub_retriever, chunk):
    """Graph wired entirely with stubs."""

    def _build(retriever=None, provider=None, documents=None, scheduler=None):
        return build_graph(
            provider=provider or MockProvider(responses=["stub answer"]),
            retriever=retriever or stub_retriever(),
            index_lister=lambda gid: documents if documents is not None else [
                {"resource_id": 1, "filename": "os-notes.pdf", "chunks": 12}
            ],
            scheduler=scheduler or (lambda ctx, dur: dict(PLAN)),
        )

    return _build


def test_graph_imports_and_compiles_without_groq_or_faiss(graph):
    assert graph() is not None


# --- routing: the five sample messages -----------------------------------

SAMPLES = [
    ("Index my uploaded PDF notes", "resource"),
    ("What is Round Robin scheduling?", "rag"),
    ("Create a study plan for next week", "scheduler"),
    ("What documents are in my notes?", "resource"),
    ("Explain the difference between paging and segmentation", "rag"),
]


@pytest.mark.parametrize("message,expected_node", SAMPLES)
def test_coordinator_routes_the_five_sample_messages(graph, message, expected_node):
    result = run_agents(group_id=1, message=message, graph=graph())

    assert result["trace"] == ["coordinator", expected_node]
    assert result["intent"] == expected_node
    assert result["halted"] is True


# --- per-agent results through the full graph ----------------------------


def test_rag_route_returns_answer_and_citations(graph, stub_retriever, chunk):
    # The scripted answer must be supported by the chunk, otherwise the
    # grounding guardrail replaces it - which is the behaviour asserted in
    # tests/test_guardrail_grounding.py.
    compiled = graph(
        retriever=stub_retriever([chunk("Round Robin uses fixed time slices.", "os.pdf", page=4, score=0.82)]),
        provider=MockProvider(responses=["Round Robin uses fixed time slices."]),
    )

    result = run_agents(group_id=1, message="What is Round Robin?", graph=compiled)

    assert result["answer"] == "Round Robin uses fixed time slices."
    assert result["citations"] == [{"filename": "os.pdf", "page": 4, "score": 0.82}]


def test_rag_route_returns_not_in_notes_for_unsupported_questions(graph, stub_retriever):
    compiled = graph(retriever=stub_retriever([]))

    result = run_agents(group_id=1, message="What is quantum gravity?", graph=compiled)

    assert result["answer"] == NOT_IN_NOTES
    assert result["citations"] == []


def test_resource_route_lists_the_index(graph):
    result = run_agents(group_id=1, message="What documents are in my notes?", graph=graph())

    assert "os-notes.pdf" in result["answer"]


def test_resource_route_reports_an_empty_index(graph):
    compiled = graph(documents=[])

    result = run_agents(group_id=1, message="What is in my notes?", graph=compiled)

    assert result["answer"] == NO_INDEX_MESSAGE


def test_scheduler_route_returns_a_plan(graph):
    result = run_agents(group_id=1, message="Create a study plan for next week", graph=graph())

    assert result["plan"]["title"] == "Paging revision"


# --- clarification --------------------------------------------------------


def test_unclear_message_asks_one_question_and_runs_no_agent(graph):
    result = run_agents(group_id=1, message="do the thing", graph=graph())

    assert result["needs_clarification"] is True
    assert result["answer"].count("?") == 1
    assert result["trace"] == ["coordinator"]


# --- multi-hop and the step cap ------------------------------------------


def test_multi_intent_message_visits_both_agents(graph):
    result = run_agents(group_id=1, message="Explain paging and then make a study plan", graph=graph())

    assert result["trace"] == ["coordinator", "rag", "coordinator", "scheduler"]
    assert result["steps"] == 4
    assert result["plan"]["title"] == "Paging revision"


def test_no_run_exceeds_the_six_step_cap(graph):
    """Start with the budget nearly spent: the graph must stop, not overrun."""
    compiled = graph()
    state = new_state(group_id=1, message="Explain paging and then make a study plan")
    state["steps"] = MAX_STEPS - 1

    result = compiled.invoke(state, config={"recursion_limit": MAX_STEPS * 2 + 2})

    assert result["steps"] <= MAX_STEPS
    assert result["halted"] is True


def test_cap_stops_a_queue_longer_than_the_budget(graph):
    """A coordinator holding more queued intents than steps allows still halts."""
    compiled = graph()
    state = new_state(group_id=1, message="anything")
    state["pending_intents"] = ["rag", "scheduler", "resource", "rag", "scheduler", "resource"]

    result = compiled.invoke(state, config={"recursion_limit": MAX_STEPS * 2 + 2})

    assert result["steps"] <= MAX_STEPS
    assert result["halted"] is True


def test_step_counter_counts_nodes_not_edges(graph):
    result = run_agents(group_id=1, message="What is Round Robin?", graph=graph())

    assert result["steps"] == len(result["trace"]) == 2
