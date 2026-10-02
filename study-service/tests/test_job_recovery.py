"""Generation jobs carry a lease (started_at). Only jobs whose lease has expired are failed.

A restart drops in-process BackgroundTasks, so their rows would stay
PENDING/GENERATING forever. But another replica may be running a job right now,
so "fail everything at startup" is wrong: only expired leases are orphans.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.models.flashcard import FlashcardDeck, FlashcardDeckStatus
from app.models.quiz import Quiz, QuizStatus
from app.models.session import SessionSummary, SummaryStatus
from app.services.job_recovery import JOB_LEASE, expire_if_stale, expire_stale_jobs

NOW = datetime(2026, 10, 2, 12, 0, 0)
FRESH = NOW - timedelta(minutes=1)
EXPIRED = NOW - JOB_LEASE - timedelta(minutes=1)


def test_only_jobs_with_an_expired_lease_are_failed(db):
    db.add_all([
        Quiz(session_id=1, status=QuizStatus.GENERATING, started_at=FRESH),     # another replica is on it
        Quiz(session_id=2, status=QuizStatus.GENERATING, started_at=EXPIRED),   # orphaned
        Quiz(session_id=3, status=QuizStatus.GENERATING, started_at=None),      # from before leases existed
        Quiz(session_id=4, status=QuizStatus.READY, started_at=EXPIRED),
        FlashcardDeck(session_id=1, status=FlashcardDeckStatus.PENDING, started_at=EXPIRED),
        SessionSummary(session_id=1, status=SummaryStatus.GENERATING, started_at=FRESH),
    ])
    db.commit()

    assert expire_stale_jobs(db, now=NOW) == 3

    assert {q.session_id: q.status for q in db.query(Quiz)} == {
        1: QuizStatus.GENERATING, 2: QuizStatus.FAILED, 3: QuizStatus.FAILED, 4: QuizStatus.READY,
    }
    assert db.query(FlashcardDeck).one().status == FlashcardDeckStatus.FAILED
    assert db.query(SessionSummary).one().status == SummaryStatus.GENERATING


def test_reading_a_stale_job_reports_it_failed(db):
    quiz = Quiz(session_id=1, status=QuizStatus.GENERATING, started_at=EXPIRED)
    db.add(quiz)
    db.commit()

    expire_if_stale(db, quiz, now=NOW)

    db.refresh(quiz)
    assert quiz.status == QuizStatus.FAILED


def test_reading_an_active_job_leaves_it_alone(db):
    quiz = Quiz(session_id=1, status=QuizStatus.GENERATING, started_at=FRESH)
    db.add(quiz)
    db.commit()

    expire_if_stale(db, quiz, now=NOW)

    db.refresh(quiz)
    assert quiz.status == QuizStatus.GENERATING


def test_starting_a_job_takes_a_fresh_lease(db, monkeypatch):
    from app.services import quiz_service

    class _Fail(Exception):
        pass

    def fake_client(*a, **k):
        raise _Fail()

    monkeypatch.setattr(quiz_service, "SessionLocal", lambda: db)
    monkeypatch.setattr(db, "close", lambda: None)
    monkeypatch.setattr(quiz_service.httpx, "Client", fake_client)

    before = datetime.utcnow()
    quiz_service.generate_quiz_task(session_id=1, group_id=1, resource_ids=[1])

    quiz = db.query(Quiz).one()
    assert quiz.started_at is not None and quiz.started_at >= before - timedelta(seconds=1)


def test_session_endpoints_report_an_orphaned_job_as_failed(db):
    from app.api.endpoints import sessions as sessions_endpoint
    from app.models.session import StudySession
    from app.repositories import group_repo
    from app.schemas.group import StudyGroupCreate

    group = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS"), user_id=7)
    session = StudySession(group_id=group.id, title="Paging", scheduled_at=NOW, duration_minutes=60, created_by=7)
    db.add(session)
    db.commit()
    long_ago = datetime.utcnow() - JOB_LEASE - timedelta(minutes=5)
    db.add_all([
        Quiz(session_id=session.id, status=QuizStatus.GENERATING, started_at=long_ago),
        FlashcardDeck(session_id=session.id, status=FlashcardDeckStatus.GENERATING, started_at=long_ago),
        SessionSummary(session_id=session.id, status=SummaryStatus.GENERATING, started_at=long_ago),
    ])
    db.commit()
    user = {"userId": 7}

    assert sessions_endpoint.get_session_quiz(session.id, db=db, user=user)["data"].status == QuizStatus.FAILED
    assert sessions_endpoint.get_session_flashcards(session.id, db=db, user=user)["data"].status == FlashcardDeckStatus.FAILED
    assert sessions_endpoint.get_session_summary(session.id, db=db, user=user)["data"].status == SummaryStatus.FAILED
