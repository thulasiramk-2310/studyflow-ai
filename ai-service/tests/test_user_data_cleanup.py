"""Account deletion also removes the user's Ask AI history and MCP plans."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.mcp import plan_store
from app.models.chat import ChatMessage, ChatSession

HEADERS = {"X-Internal-Key": settings.INTERNAL_API_KEY}
LEAVER, OTHER = 7, 8


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override():
        s = Session()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override
    s = Session()
    yield s
    s.close()
    app.dependency_overrides.clear()


def _chat(db, user_id):
    session = ChatSession(user_id=user_id, group_id=1, title="t")
    db.add(session)
    db.commit()
    db.add(ChatMessage(session_id=session.id, role="user", content=f"hello from {user_id}"))
    db.commit()


def test_deleting_a_user_removes_only_their_chats_and_plans(db):
    _chat(db, LEAVER)
    _chat(db, OTHER)
    plan_store.save_plan(1, LEAVER, {"title": "mine"})
    plan_store.save_plan(1, OTHER, {"title": "theirs"})

    res = TestClient(app).delete(f"/api/v1/ai/chat/users/{LEAVER}", headers=HEADERS)

    assert res.status_code == 200
    assert db.query(ChatSession).filter(ChatSession.user_id == LEAVER).count() == 0
    assert db.query(ChatMessage).filter(ChatMessage.content == f"hello from {LEAVER}").count() == 0
    assert db.query(ChatSession).filter(ChatSession.user_id == OTHER).count() == 1
    assert plan_store.get_plan(1, LEAVER) is None
    assert plan_store.get_plan(1, OTHER) == {"title": "theirs"}


def test_cleanup_requires_the_internal_key(db):
    res = TestClient(app).delete(f"/api/v1/ai/chat/users/{LEAVER}", headers={"X-Internal-Key": "wrong"})
    assert res.status_code in (401, 403)
