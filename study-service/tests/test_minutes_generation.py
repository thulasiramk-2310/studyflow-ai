"""The summary job writes minutes from the transcript when there is one."""

from __future__ import annotations

from datetime import datetime

import pytest

from app.models.notification import Notification
from app.models.session import SessionSummary, StudySession, SummaryStatus
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.services import summary_service

MINUTES = {
    "executive_summary": "Chose Postgres 16.", "key_concepts": ["Postgres"], "important_points": [],
    "decisions": ["Ship Postgres 16"], "open_questions": ["Replicas?"],
    "action_items": [{"task": "Send draft", "owner": "Priya", "due": "Friday"}], "model": "m",
}


@pytest.fixture
def ai(monkeypatch, db):
    calls = []

    class Response:
        def __init__(self, body):
            self.body = body

        def raise_for_status(self):
            pass

        def json(self):
            return {"success": True, "data": self.body}

    class FakeClient:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def post(self, url, json=None, headers=None):
            calls.append((url, json))
            return Response(MINUTES if url.endswith("/minutes") else {"executive_summary": "Docs", "key_concepts": []})

    monkeypatch.setattr(summary_service, "SessionLocal", lambda: db)
    monkeypatch.setattr(db, "close", lambda: None)
    monkeypatch.setattr(summary_service.httpx, "Client", FakeClient)
    return calls


def _session(db, transcript=None):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Platform", audience="professional"), user_id=7)
    group_repo.add_member(db=db, group_id=g.id, user_id=8)
    s = StudySession(group_id=g.id, title="Sync", scheduled_at=datetime(2026, 10, 2), duration_minutes=30, created_by=7,
                     meeting_transcript=transcript, meeting_transcript_source="transcript" if transcript else None,
                     meeting_transcript_by=8 if transcript else None)
    db.add(s)
    db.commit()
    return g, s


def test_a_transcript_produces_draft_minutes_announced_only_to_the_organizer(db, ai):
    g, s = _session(db, "Priya: I'll send the draft by Friday.")
    summary_service.generate_session_summary_task(s.id, g.id, [])  # no documents attached
    url, sent = ai[0]
    assert url.endswith("/api/v1/ai/minutes")
    assert sent["transcript"].startswith("Priya:") and sent["source"] == "transcript" and sent["audience"] == "professional"
    m = db.query(SessionSummary).filter_by(session_id=s.id).one()
    assert m.status == SummaryStatus.READY and m.review_status == "DRAFT"
    assert m.decisions == ["Ship Postgres 16"] and m.action_items[0]["owner"] == "Priya"
    assert m.source == "transcript" and m.source_by == 8
    assert [n.user_id for n in db.query(Notification).all()] == [7]  # the member hears on approval


def test_without_a_transcript_the_document_summary_is_unchanged(db, ai):
    g, s = _session(db)
    summary_service.generate_session_summary_task(s.id, g.id, [5])
    assert ai[0][0].endswith("/api/v1/ai/summary")
    m = db.query(SessionSummary).filter_by(session_id=s.id).one()
    assert m.review_status is None and m.source is None and m.decisions is None


def test_regenerating_after_approval_starts_a_new_draft(db, ai):
    g, s = _session(db, "Priya: I'll send the draft by Friday.")
    db.add(SessionSummary(session_id=s.id, status=SummaryStatus.READY, review_status="APPROVED", approved_by=7, approved_at=datetime(2026, 10, 2)))
    db.commit()
    summary_service.generate_session_summary_task(s.id, g.id, [])
    m = db.query(SessionSummary).filter_by(session_id=s.id).one()
    assert m.review_status == "DRAFT" and m.approved_by is None and m.approved_at is None
