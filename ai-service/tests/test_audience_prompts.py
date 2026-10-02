"""Prompts carry a one-line hint for who the content is written for."""

from __future__ import annotations

import pytest

from app.llm.provider import MockProvider, set_provider
from app.prompts.audience import AUDIENCE_HINTS, with_audience

TEAM_HINT = AUDIENCE_HINTS["professional"]
STUDENT_HINT = AUDIENCE_HINTS["student"]


def test_with_audience_appends_the_hint_and_defaults_to_student():
    assert with_audience("P", "professional").endswith(TEAM_HINT)
    assert with_audience("P", None).endswith(STUDENT_HINT)
    assert with_audience("P", "nonsense").endswith(STUDENT_HINT)


@pytest.mark.parametrize("module_name, func, extra", [
    ("summary", "generate_summary", {}),
    ("quiz", "generate_quiz", {}),
    ("flashcard", "generate_flashcards", {"count": 5}),
])
def test_generation_prompts_use_the_requested_audience(monkeypatch, module_name, func, extra):
    import importlib

    module = importlib.import_module(f"app.services.{module_name}")
    monkeypatch.setattr(module, "generate_embeddings", lambda texts: [[0.0]])
    monkeypatch.setattr(module, "search_index", lambda **kwargs: [{"content": "Deadlock needs four conditions."}])
    provider = MockProvider(default="not json")
    set_provider(provider)

    with pytest.raises(Exception):
        getattr(module, func)(group_id=1, resource_ids=[1], audience="professional", **extra)

    assert provider.calls and all(TEAM_HINT in c for c in provider.calls)


def test_schedule_prompt_uses_the_audience():
    from app.services.schedule import generate_schedule

    provider = MockProvider(default='{"title": "Sync", "duration_minutes": 30}')
    set_provider(provider)
    generate_schedule("Group context", 30, audience="professional")
    assert TEAM_HINT in provider.calls[0]


def test_chat_answers_use_the_asking_users_audience(stub_retriever, chunk):
    from app.agents.graph import build_graph
    from app.services.agent_chat import run_agent_chat

    provider = MockProvider(default="Round Robin assigns a fixed time slice to each process.")
    graph = build_graph(provider=provider, retriever=stub_retriever([chunk("Round Robin assigns a fixed time slice to each process.")]),
                        index_lister=lambda gid: [], scheduler=lambda ctx, dur: {})
    run_agent_chat(group_id=1, query="What is Round Robin?", graph=graph, audience="professional")
    assert any(TEAM_HINT in c for c in provider.calls)


def test_mcp_plan_uses_the_groups_audience():
    from app.mcp.tools import create_study_plan

    seen = {}
    create_study_plan(group_id=1, user_id=7, topics=["Q3 roadmap"], dates=[], confirm=True,
                      scheduler=lambda ctx, dur: seen.setdefault("ctx", ctx) or {"title": "Sync"},
                      audience_fetcher=lambda gid: "professional")
    assert TEAM_HINT in seen["ctx"]


def test_mcp_plan_errors_when_audience_unavailable():
    from app.mcp.tools import ToolError, create_study_plan

    def down(gid):
        raise ConnectionError("study-service down")

    with pytest.raises(ToolError):
        create_study_plan(group_id=1, user_id=7, topics=[], dates=[], confirm=True,
                          scheduler=lambda ctx, dur: {"title": "x"}, audience_fetcher=down)
