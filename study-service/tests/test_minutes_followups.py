"""Follow-ups to the minutes review: wording, stale jobs, attribution, organizer notice and edit limits."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from pydantic import ValidationError

from app.api.endpoints import sessions as ep
from app.models.notification import Notification
from app.models.session import SessionStatus, SessionSummary, StudySession, SummaryStatus
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.schemas.session import MinutesUpdate, SessionSummaryResponse
from app.services import summary_service

ORGANIZER, MEMBER = 7, 8


def _session(db, audience="student", transcript=None):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS", audience=audience), user_id=ORGANIZER)
    group_repo.add_member(db=db, group_id=g.id, user_id=MEMBER)
    s = StudySession(group_id=g.id, title="Sync", scheduled_at=datetime(2026, 10, 2), duration_minutes=30,
                     created_by=ORGANIZER, status=SessionStatus.COMPLETED, meeting_transcript=transcript,
                     meeting_transcript_source="notes" if transcript else None,
                     meeting_transcript_by=MEMBER if transcript else None,
                     meeting_transcript_at=datetime(2026, 10, 2, 10) if transcript else None)
    db.add(s)
    db.commit()
    return g, s


@pytest.mark.parametrize("audience, message", [
    ("student", "The summary for 'Sync' is ready to read."),
    ("professional", "The minutes for 'Sync' are ready to read."),
])
def test_approval_notice_reads_correctly(db, audience, message):
    _, s = _session(db, audience)
    db.add(SessionSummary(session_id=s.id, status=SummaryStatus.READY, review_status="DRAFT"))
    db.commit()
    ep.approve_session_summary(s.id, db=db, user={"userId": ORGANIZER})
    assert [n.message for n in db.query(Notification).all()] == [message]


def _fake_ai(monkeypatch, db, on_post=None):
    class Response:
        def raise_for_status(self):
            pass

        def json(self):
            return {"success": True, "data": {"executive_summary": "Stale minutes", "decisions": ["x"], "action_items": []}}

    class FakeClient:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def post(self, url, json=None, headers=None):
            if on_post:
                on_post()
            return Response()

    monkeypatch.setattr(summary_service, "SessionLocal", lambda: db)
    monkeypatch.setattr(db, "close", lambda: None)
    monkeypatch.setattr(summary_service.httpx, "Client", FakeClient)


def test_a_job_for_a_replaced_transcript_does_not_overwrite_newer_minutes(db, monkeypatch):
    g, s = _session(db, transcript="Old notes.")

    def replaced_mid_job():
        s.meeting_transcript = "New notes."
        s.meeting_transcript_at = s.meeting_transcript_at + timedelta(minutes=1)
        db.commit()

    _fake_ai(monkeypatch, db, replaced_mid_job)
    summary_service.generate_session_summary_task(s.id, g.id, [])
    m = db.query(SessionSummary).filter_by(session_id=s.id).one()
    assert m.summary != "Stale minutes" and m.review_status is None


def test_the_organizer_is_told_when_draft_minutes_are_ready(db, monkeypatch):
    g, s = _session(db, "professional", transcript="Agreed.")
    _fake_ai(monkeypatch, db)
    summary_service.generate_session_summary_task(s.id, g.id, [])
    notes = db.query(Notification).all()
    assert [(n.user_id, n.title) for n in notes] == [(ORGANIZER, "Draft minutes ready to review")]


def test_summary_response_names_who_supplied_the_source(db):
    _, s = _session(db, transcript="Agreed.")
    summary = SessionSummary(session_id=s.id, status=SummaryStatus.READY, source="notes", source_by=MEMBER)
    db.add(summary)
    db.commit()
    assert SessionSummaryResponse.model_validate(summary).source_by == MEMBER


def test_minutes_edits_are_bounded():
    with pytest.raises(ValidationError):
        MinutesUpdate(decisions=["d"] * 51)
    with pytest.raises(ValidationError):
        MinutesUpdate(open_questions=["q" * 1001])
    with pytest.raises(ValidationError):
        MinutesUpdate(action_items=[{"task": "t"}] * 51)
    MinutesUpdate(decisions=["d"] * 50, open_questions=["q" * 1000])
