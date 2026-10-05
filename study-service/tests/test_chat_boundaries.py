"""Validate at the public API boundary before calling AI or reading history."""
import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.api.endpoints import ai
from app.core.database import get_db
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate


@pytest.fixture
def client(db, monkeypatch):
    app = FastAPI()
    app.include_router(ai.router, prefix="/ai")
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: {"userId": 7}
    monkeypatch.setattr(ai.limiter, "enabled", False)
    return TestClient(app)


@pytest.mark.parametrize("body", [{"groupId": 1, "query": "x" * 8001}, {"groupId": -1, "query": "hi"}])
def test_oversized_or_invalid_chat_never_reaches_ai(client, body):
    assert client.post("/ai/chat", json=body).status_code == 422


@pytest.mark.parametrize("path", ["/chat/sessions?group_id=1&limit=101", "/chat/sessions/1?group_id=1&before_id=0"])
def test_history_paging_is_validated_publicly(client, path):
    assert client.get(f"/ai{path}").status_code == 422


@pytest.mark.parametrize("method,path,body", [
    ("GET", "/chat/sessions?group_id=999", None),
    ("GET", "/chat/sessions/1?group_id=999", None),
    ("DELETE", "/chat/sessions/1?group_id=999", None),
    ("POST", "/chat", {"groupId": 999, "query": "hello"}),
])
def test_nonmember_cannot_use_another_groups_ai(client, method, path, body):
    assert client.request(method, f"/ai{path}", json=body).status_code == 403


def test_cursor_forwarding_uses_authenticated_identity(client, db, monkeypatch):
    group = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Own"), user_id=7)
    seen = []

    class Upstream:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def get(self, url, **kwargs):
            seen.append(url)
            return httpx.Response(200, json=[], request=httpx.Request("GET", url))

    monkeypatch.setattr(ai.httpx, "AsyncClient", Upstream)
    response = client.get(f"/ai/chat/sessions/9?group_id={group.id}&latest=true&before_id=31&user_id=999")
    assert response.status_code == 200
    params = httpx.URL(seen[0]).params
    assert params["user_id"] == "7"
    assert params["before_id"] == "31"
    assert params["latest"] == "true"
