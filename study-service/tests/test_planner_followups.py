"""Next-session proposals use bounded, approved, group-scoped evidence."""
import asyncio
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.models.session import StudySession, SessionSummary, SessionStatus, SummaryStatus
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.services import agent_service


@pytest.fixture
def planner(db, monkeypatch):
    captured = {}

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            captured.update(kwargs["json"])
            import httpx
            return httpx.Response(200, request=httpx.Request("POST", url),
                                  json={"success": True, "data": {"title": "Review progress"}})

    monkeypatch.setattr(agent_service.httpx, "AsyncClient", Client)

    def run(group_id):
        asyncio.run(agent_service.generate_agentic_schedule(db, group_id, 45))
        return captured["context"]

    return run


def group(db, name="Platform"):
    return group_repo.create_group(db=db, group_in=StudyGroupCreate(name=name, audience="professional"), user_id=7)


def session(db, group_id, title="Weekly sync", day=0, **summary_fields):
    s = StudySession(group_id=group_id, title=title, scheduled_at=datetime(2026, 10, 1) + timedelta(days=day),
                     duration_minutes=30, created_by=7, status=SessionStatus.COMPLETED)
    s.summary = SessionSummary(status=SummaryStatus.READY, **summary_fields)
    db.add(s)
    db.commit()
    return s


def test_approved_followups_keep_evidence_and_missing_assignments(db, planner):
    g = group(db)
    session(db, g.id, source="transcript", review_status="APPROVED", summary="Pilot agreed",
            action_items=[{"task": "Prepare pilot", "owner": "Maya", "due": ""}],
            open_questions=["Which region first?"])
    context = planner(g.id)
    assert "Approved minutes follow-ups" in context
    assert '"task": "Prepare pilot"' in context
    assert '"owner": "Maya"' in context
    assert '"due": null' in context
    assert "Which region first?" in context
    assert db.query(StudySession).count() == 1  # proposal only


def test_stated_due_dates_reach_the_planner(db, planner):
    g = group(db)
    session(db, g.id, source="transcript", review_status="APPROVED", summary="Pilot agreed",
            action_items=[{"task": "Prepare pilot", "owner": "Maya", "due": "Friday"}])
    assert '"due": "Friday"' in planner(g.id)


@pytest.mark.parametrize("review", ["DRAFT", None])
def test_unapproved_minutes_do_not_influence_the_plan(db, planner, review):
    g = group(db)
    session(db, g.id, source="transcript", review_status=review,
            summary="Unapproved secret", action_items=[{"task": "Unapproved action"}],
            open_questions=["Unapproved question"])
    context = planner(g.id)
    assert "Unapproved" not in context


def test_planner_never_reads_another_groups_minutes(db, planner):
    own, other = group(db), group(db, "Other")
    session(db, other.id, source="notes", review_status="APPROVED", summary="Other group secret")
    assert "Other group secret" not in planner(own.id)


def test_planner_keeps_recent_history_and_bounds_context(db, planner):
    g = group(db)
    for day in range(15):
        session(db, g.id, title=f"History-{day:02}", day=day, summary="Long summary " * 1000)
    context = planner(g.id)
    assert "History-14" in context
    assert "History-00" not in context
    assert len(context) <= agent_service.CONTEXT_LIMIT


@pytest.mark.parametrize("status", [SessionStatus.SCHEDULED, SessionStatus.LIVE])
def test_active_meeting_prevents_another_plan(db, planner, status):
    g = group(db)
    s = session(db, g.id)
    s.status = status
    db.commit()
    with pytest.raises(HTTPException) as exc:
        planner(g.id)
    assert exc.value.status_code == 400
