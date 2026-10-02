"""Members add the meeting's transcript or notes once the session has started."""

from __future__ import annotations

import asyncio
import io
from datetime import datetime, timedelta

import pytest
from fastapi import BackgroundTasks, HTTPException
from starlette.datastructures import UploadFile

from app.api.endpoints import sessions as ep
from app.models.session import SessionStatus, StudySession
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.schemas.session import TranscriptNotes
from app.services import transcript_service
from app.services.summary_service import generate_session_summary_task

ORGANIZER, MEMBER, OUTSIDER = 7, 8, 9


def _session(db, *, started=True, status=SessionStatus.SCHEDULED):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Platform"), user_id=ORGANIZER)
    group_repo.add_member(db=db, group_id=g.id, user_id=MEMBER)
    when = datetime.utcnow() + (timedelta(hours=-1) if started else timedelta(days=1))
    s = StudySession(group_id=g.id, title="Sync", scheduled_at=when, duration_minutes=30, created_by=ORGANIZER, status=status)
    db.add(s)
    db.commit()
    return s


def _file(name, data=b"WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nPriya: hi\n"):
    return UploadFile(file=io.BytesIO(data), filename=name)


def test_a_member_pastes_notes_and_is_credited(db):
    s = _session(db)
    ep.save_transcript_notes(s.id, TranscriptNotes(text="  Agreed to ship Postgres 16.  "), BackgroundTasks(), db=db, user={"userId": MEMBER})
    db.refresh(s)
    assert s.meeting_transcript == "Agreed to ship Postgres 16."
    assert s.meeting_transcript_source == "notes" and s.meeting_transcript_by == MEMBER
    assert s.meeting_transcript_at is not None


def test_outsiders_are_refused(db):
    s = _session(db)
    with pytest.raises(HTTPException) as e:
        ep.save_transcript_notes(s.id, TranscriptNotes(text="x"), BackgroundTasks(), db=db, user={"userId": OUTSIDER})
    assert e.value.status_code == 403


def test_not_before_the_session_starts(db):
    s = _session(db, started=False)
    with pytest.raises(HTTPException) as e:
        ep.save_transcript_notes(s.id, TranscriptNotes(text="x"), BackgroundTasks(), db=db, user={"userId": MEMBER})
    assert e.value.status_code == 400


def test_empty_and_oversized_notes(db):
    s = _session(db)
    with pytest.raises(HTTPException) as empty:
        ep.save_transcript_notes(s.id, TranscriptNotes(text="   "), BackgroundTasks(), db=db, user={"userId": MEMBER})
    assert empty.value.status_code == 400
    with pytest.raises(HTTPException) as big:
        ep.save_transcript_notes(s.id, TranscriptNotes(text="x" * 200_001), BackgroundTasks(), db=db, user={"userId": MEMBER})
    assert big.value.status_code == 413


def test_uploaded_transcript_is_parsed_and_marked(db, monkeypatch):
    s = _session(db)
    monkeypatch.setattr(transcript_service, "parse_transcript_file", lambda name, data: "Priya: hi")
    ep.upload_transcript_file(s.id, BackgroundTasks(), file=_file("meeting.vtt"), db=db, user={"userId": MEMBER})
    db.refresh(s)
    assert (s.meeting_transcript, s.meeting_transcript_source) == ("Priya: hi", "transcript")


def test_wrong_type_and_oversized_files_fail_before_parsing(db, monkeypatch):
    s = _session(db)

    def boom(*a):
        raise AssertionError("parser must not run")

    monkeypatch.setattr(transcript_service, "parse_transcript_file", boom)
    with pytest.raises(HTTPException) as wrong:
        ep.upload_transcript_file(s.id, BackgroundTasks(), file=_file("slides.pdf"), db=db, user={"userId": MEMBER})
    assert wrong.value.status_code == 400
    with pytest.raises(HTTPException) as big:
        ep.upload_transcript_file(s.id, BackgroundTasks(), file=_file("m.txt", b"x" * (5 * 1024 * 1024 + 1)), db=db, user={"userId": MEMBER})
    assert big.value.status_code == 413


def test_a_file_the_parser_rejects_is_a_400(db, monkeypatch):
    s = _session(db)

    def reject(*a):
        raise transcript_service.TranscriptParseError("This Word file could not be read.")

    monkeypatch.setattr(transcript_service, "parse_transcript_file", reject)
    with pytest.raises(HTTPException) as e:
        ep.upload_transcript_file(s.id, BackgroundTasks(), file=_file("m.docx", b"zz"), db=db, user={"userId": MEMBER})
    assert e.value.status_code == 400 and "Word file" in e.value.detail


def test_adding_to_a_completed_session_starts_the_minutes(db):
    s = _session(db, status=SessionStatus.COMPLETED)
    tasks = BackgroundTasks()
    ep.save_transcript_notes(s.id, TranscriptNotes(text="Agreed."), tasks, db=db, user={"userId": MEMBER})
    assert [t.func for t in tasks.tasks] == [generate_session_summary_task]


def test_reading_the_transcript_names_who_added_it(db, monkeypatch):
    s = _session(db)
    ep.save_transcript_notes(s.id, TranscriptNotes(text="Agreed."), BackgroundTasks(), db=db, user={"userId": MEMBER})

    async def profile(user_id):
        return {"id": user_id, "name": "Priya Sharma"}

    monkeypatch.setattr(ep.auth_client, "get_user_profile", profile)
    out = asyncio.run(ep.get_session_transcript(s.id, db=db, user={"userId": ORGANIZER}))["data"]
    assert out["text"] == "Agreed." and out["by_name"] == "Priya Sharma" and out["source"] == "notes"
