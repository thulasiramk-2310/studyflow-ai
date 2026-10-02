"""Timestamps stored as naive UTC must reach the browser marked as UTC.

Without an offset, browsers parse "2026-10-02T10:00:00" as local time, so a
notification created a moment ago shows as "about 6 hours ago" in India.
"""

from datetime import datetime, timezone
from typing import Annotated

from pydantic import TypeAdapter

from app.models.notification import NotificationType
from app.schemas.notification import NotificationResponse
from app.schemas.resource import ResourceResponse
from app.schemas.session import SessionResponse, SessionSummaryResponse
from app.schemas.quiz import QuizResponse
from app.schemas.flashcard import FlashcardResponse, FlashcardDeckResponse


NAIVE_UTC = datetime(2026, 10, 2, 10, 0, 0)


def test_naive_notification_timestamp_is_serialised_as_utc():
    n = NotificationResponse(id=1, user_id=1, title="Quiz ready", type=list(NotificationType)[0], is_read=False, created_at=NAIVE_UTC)

    assert n.created_at.tzinfo is not None
    assert n.created_at.utcoffset().total_seconds() == 0
    assert n.model_dump_json().count("2026-10-02T10:00:00Z") == 1


def test_aware_timestamps_are_left_alone():
    aware = datetime(2026, 10, 2, 15, 30, tzinfo=timezone.utc)
    n = NotificationResponse(id=1, user_id=1, title="t", type=list(NotificationType)[0], is_read=False, created_at=aware)

    assert n.created_at == aware


def test_other_naive_utc_timestamps_are_marked_utc():
    fields = [
        (ResourceResponse, "created_at"),
        (SessionResponse, "created_at"),
        (SessionResponse, "updated_at"),
        (SessionSummaryResponse, "generated_at"),
        (QuizResponse, "generated_at"),
        (FlashcardResponse, "created_at"),
        (FlashcardDeckResponse, "generated_at"),
    ]
    for schema, name in fields:
        info = schema.model_fields[name]
        annotation = Annotated[info.annotation, *info.metadata] if info.metadata else info.annotation
        value = TypeAdapter(annotation).validate_python(NAIVE_UTC)
        assert value.tzinfo is not None, f"{schema.__name__}.{name} stays naive"
