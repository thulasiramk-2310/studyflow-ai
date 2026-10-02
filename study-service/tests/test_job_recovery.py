"""Generation runs in-process; after a restart, jobs it was running are gone for good.

Their rows must not stay PENDING/GENERATING forever - the UI would show
"Writing questions..." with no way to retry.
"""

from __future__ import annotations

from app.models.flashcard import FlashcardDeck, FlashcardDeckStatus
from app.models.quiz import Quiz, QuizStatus
from app.models.session import SessionSummary, SummaryStatus
from app.services.job_recovery import recover_interrupted_jobs


def test_interrupted_jobs_are_marked_failed_and_finished_ones_are_kept(db):
    db.add_all([
        Quiz(session_id=1, status=QuizStatus.GENERATING),
        Quiz(session_id=2, status=QuizStatus.READY),
        FlashcardDeck(session_id=1, status=FlashcardDeckStatus.PENDING),
        FlashcardDeck(session_id=2, status=FlashcardDeckStatus.READY),
        SessionSummary(session_id=1, status=SummaryStatus.GENERATING),
        SessionSummary(session_id=2, status=SummaryStatus.READY),
    ])
    db.commit()

    recovered = recover_interrupted_jobs(db)

    assert recovered == 3
    assert {q.session_id: q.status for q in db.query(Quiz)} == {1: QuizStatus.FAILED, 2: QuizStatus.READY}
    assert {d.session_id: d.status for d in db.query(FlashcardDeck)} == {1: FlashcardDeckStatus.FAILED, 2: FlashcardDeckStatus.READY}
    assert {s.session_id: s.status for s in db.query(SessionSummary)} == {1: SummaryStatus.FAILED, 2: SummaryStatus.READY}
