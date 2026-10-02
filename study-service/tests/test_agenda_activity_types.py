"""AI-proposed agendas use free-form activity types; saving a session must not fail on them."""

from __future__ import annotations

import pytest

from app.schemas.session import AgendaItem


@pytest.mark.parametrize("given, stored", [
    ("lecture", "learning"),
    ("Lecture", "learning"),
    ("review", "revision"),
    ("exercise", "practice"),
    ("Q&A", "discussion"),
    ("assessment", "quiz"),
    ("something new", "learning"),
    ("break", "break"),
    ("QUIZ", "quiz"),
])
def test_unknown_activity_types_are_mapped_not_rejected(given, stored):
    assert AgendaItem(title="x", activity_type=given).activity_type == stored
