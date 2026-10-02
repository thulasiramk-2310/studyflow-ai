"""Minutes fields round-trip, and the transcript text never rides along on session payloads."""

from __future__ import annotations

from datetime import datetime

from app.models.session import SessionSummary, StudySession, SummaryStatus
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.schemas.session import SessionResponse, SessionSummaryResponse


def test_summary_response_carries_minutes(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Platform"), user_id=7)
    s = StudySession(group_id=g.id, title="Sync", scheduled_at=datetime(2026, 10, 2), duration_minutes=30, created_by=7,
                     meeting_transcript="Priya: hi", meeting_transcript_source="transcript", meeting_transcript_by=7)
    db.add(s)
    db.commit()
    summary = SessionSummary(session_id=s.id, status=SummaryStatus.READY, summary="Chose Postgres",
                             decisions=["Ship Postgres 16"], open_questions=["Replicas?"], source="transcript",
                             review_status="DRAFT",
                             action_items=[{"task": "Send draft", "owner": "Priya", "due": ""}, "Legacy string item"])
    db.add(summary)
    db.commit()
    out = SessionSummaryResponse.model_validate(summary).model_dump()
    assert out["decisions"] == ["Ship Postgres 16"]
    assert out["action_items"][0] == {"task": "Send draft", "owner": "Priya", "due": ""}
    assert out["action_items"][1] == "Legacy string item"
    assert out["review_status"] == "DRAFT" and out["source"] == "transcript"


def test_session_payload_has_transcript_metadata_but_not_the_text():
    assert "meeting_transcript" not in SessionResponse.model_fields
    for field in ("meeting_transcript_source", "meeting_transcript_by", "meeting_transcript_at"):
        assert field in SessionResponse.model_fields
