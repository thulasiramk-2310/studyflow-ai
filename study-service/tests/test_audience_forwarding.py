"""Shared AI content is generated for the group's audience, and the artifact records it."""

from __future__ import annotations

import asyncio
from datetime import datetime

import pytest

from app.models.flashcard import FlashcardDeck
from app.models.quiz import Quiz
from app.models.session import SessionSummary, StudySession
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate


class _Captured(Exception):
    pass


def _team_session(db, audience="professional"):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Platform", audience=audience), user_id=7)
    s = StudySession(group_id=g.id, title="Sync", scheduled_at=datetime(2026, 10, 2), duration_minutes=30, created_by=7)
    db.add(s)
    db.commit()
    return g, s


@pytest.fixture
def capture(monkeypatch, db):
    """Run a generation task against the test DB and capture the JSON it sends."""
    sent = {}

    class FakeClient:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def post(self, url, json=None, headers=None):
            sent.update(json)
            raise _Captured()

    def run(module, call):
        monkeypatch.setattr(module, "SessionLocal", lambda: db)
        monkeypatch.setattr(db, "close", lambda: None)
        monkeypatch.setattr(module.httpx, "Client", FakeClient)
        call()
        return sent

    return run


@pytest.mark.parametrize(
    "module_name, task_name, model",
    [
        ("summary_service", "generate_session_summary_task", SessionSummary),
        ("quiz_service", "generate_quiz_task", Quiz),
        ("flashcard_service", "generate_flashcards_task", FlashcardDeck),
    ],
)
def test_generation_sends_and_records_the_group_audience(db, capture, module_name, task_name, model):
    import importlib

    module = importlib.import_module(f"app.services.{module_name}")
    g, s = _team_session(db)
    sent = capture(module, lambda: getattr(module, task_name)(session_id=s.id, group_id=g.id, resource_ids=[1]))

    assert sent["audience"] == "professional"
    assert db.query(model).filter(model.session_id == s.id).one().audience == "professional"


def test_generation_records_audience_used(db, capture):
    """Changing the group's audience later doesn't rewrite what earlier content was made for."""
    from app.services import quiz_service

    g, s = _team_session(db, audience="student")
    capture(quiz_service, lambda: quiz_service.generate_quiz_task(session_id=s.id, group_id=g.id, resource_ids=[1]))
    g.audience = "professional"
    db.commit()

    assert db.query(Quiz).filter(Quiz.session_id == s.id).one().audience == "student"


def test_planner_sends_the_group_audience(db, monkeypatch):
    from app.services import agent_service

    from app.models.session import SessionStatus

    g, s = _team_session(db)
    s.status = SessionStatus.COMPLETED  # the planner refuses while a session is still scheduled
    db.commit()
    sent = {}

    class FakeAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, json=None, headers=None, timeout=None):
            sent.update(json)
            raise _Captured()

    monkeypatch.setattr(agent_service.httpx, "AsyncClient", lambda *a, **k: FakeAsyncClient())
    with pytest.raises(Exception):
        asyncio.run(agent_service.generate_agentic_schedule(db=db, group_id=g.id, target_duration_minutes=45))

    assert sent["audience"] == "professional"


def test_chat_proxy_defaults_and_forwards_audience():
    from app.api.endpoints.ai import ChatRequest

    assert ChatRequest(groupId=1, query="hi").model_dump()["audience"] == "student"
    assert ChatRequest(groupId=1, query="hi", audience="professional").model_dump()["audience"] == "professional"
