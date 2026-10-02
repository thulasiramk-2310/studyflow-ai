"""Draft minutes are edited and approved by the organizer, then announced."""

from __future__ import annotations

from datetime import datetime

import pytest
from fastapi import HTTPException

from app.api.endpoints import sessions as ep
from app.models.notification import Notification
from app.models.session import SessionStatus, SessionSummary, StudySession, SummaryStatus
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.schemas.session import ActionItem, MinutesUpdate

ORGANIZER, MEMBER = 7, 8


def _draft(db, review_status="DRAFT"):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Platform", audience="professional"), user_id=ORGANIZER)
    group_repo.add_member(db=db, group_id=g.id, user_id=MEMBER)
    s = StudySession(group_id=g.id, title="Sync", scheduled_at=datetime(2026, 10, 2), duration_minutes=30,
                     created_by=ORGANIZER, status=SessionStatus.COMPLETED)
    db.add(s)
    db.commit()
    db.add(SessionSummary(session_id=s.id, status=SummaryStatus.READY, summary="Draft", review_status=review_status,
                          decisions=["Ship Postgres 16"], action_items=[{"task": "Send draft", "owner": "", "due": ""}]))
    db.commit()
    return s


def test_members_cannot_edit_or_approve(db):
    s = _draft(db)
    with pytest.raises(HTTPException) as edit:
        ep.update_session_summary(s.id, MinutesUpdate(summary="x"), db=db, user={"userId": MEMBER})
    with pytest.raises(HTTPException) as approve:
        ep.approve_session_summary(s.id, db=db, user={"userId": MEMBER})
    assert edit.value.status_code == approve.value.status_code == 403


def test_the_organizer_edits_the_draft(db):
    s = _draft(db)
    ep.update_session_summary(s.id, MinutesUpdate(decisions=["Ship Postgres 16 in November"],
                                                  action_items=[ActionItem(task="Send draft", owner="Priya", due="Friday")]),
                              db=db, user={"userId": ORGANIZER})
    m = db.query(SessionSummary).filter_by(session_id=s.id).one()
    assert m.decisions == ["Ship Postgres 16 in November"]
    assert m.action_items == [{"task": "Send draft", "owner": "Priya", "due": "Friday"}]
    assert m.summary == "Draft" and m.review_status == "DRAFT"


def test_approving_marks_final_and_tells_the_group(db):
    s = _draft(db)
    ep.approve_session_summary(s.id, db=db, user={"userId": ORGANIZER})
    m = db.query(SessionSummary).filter_by(session_id=s.id).one()
    assert m.review_status == "APPROVED" and m.approved_by == ORGANIZER and m.approved_at is not None
    assert [n.user_id for n in db.query(Notification).all()] == [MEMBER]


def test_only_drafts_can_be_approved(db):
    s = _draft(db, review_status=None)  # a document summary has nothing to approve
    with pytest.raises(HTTPException) as e:
        ep.approve_session_summary(s.id, db=db, user={"userId": ORGANIZER})
    assert e.value.status_code == 400
