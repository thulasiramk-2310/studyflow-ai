"""Minutes are written from what was said, and only keep claims the transcript supports."""

from __future__ import annotations

import json

import pytest
from fastapi import HTTPException

from app.llm.provider import MockProvider, set_provider
from app.services import minutes as minutes_service
from app.services.minutes import generate_minutes, split_transcript

TRANSCRIPT = (
    "Priya Sharma: I'll send the migration draft by Friday.\n"
    "Arjun Kumar: Agreed, we ship Postgres 16 for the reporting database.\n"
    "Priya Sharma: Still open: do we need read replicas?"
)


def _reply(**over):
    body = {
        "executive_summary": "The team chose Postgres 16.",
        "key_concepts": ["Postgres 16"],
        "important_points": ["Reporting database moves to Postgres 16"],
        "decisions": ["Ship Postgres 16 for the reporting database"],
        "action_items": [{"task": "Send the migration draft", "owner": "Priya Sharma", "due": "Friday"}],
        "open_questions": ["Do we need read replicas?"],
    }
    body.update(over)
    return json.dumps(body)


@pytest.fixture
def no_background(monkeypatch):
    monkeypatch.setattr(minutes_service, "_background_chunks", lambda group_id, resource_ids: [])


def test_the_transcript_is_the_primary_source_and_documents_are_background(monkeypatch):
    monkeypatch.setattr(minutes_service, "_background_chunks", lambda g, r: ["Postgres 16 adds logical replication."])
    provider = set_provider(MockProvider([_reply()]))
    generate_minutes(TRANSCRIPT, "transcript", group_id=1, resource_ids=[3])
    prompt = provider.calls[0]
    assert "primary source" in prompt
    assert prompt.index("--- TRANSCRIPT") < prompt.index("I'll send the migration draft") < prompt.index("--- END TRANSCRIPT")
    assert prompt.index("--- BACKGROUND DOCUMENTS") < prompt.index("logical replication")


def test_minutes_have_decisions_actions_and_questions(no_background):
    set_provider(MockProvider([_reply()]))
    m = generate_minutes(TRANSCRIPT, "transcript")
    assert m["decisions"] == ["Ship Postgres 16 for the reporting database"]
    assert m["action_items"] == [{"task": "Send the migration draft", "owner": "Priya Sharma", "due": "Friday"}]
    assert m["open_questions"] == ["Do we need read replicas?"]
    assert m["model"]


def test_unsupported_decisions_and_actions_are_dropped(no_background):
    set_provider(MockProvider([_reply(
        decisions=["Ship Postgres 16 for the reporting database", "Hire three contractors for the mobile app"],
        action_items=[{"task": "Send the migration draft", "owner": "", "due": ""},
                      {"task": "Book the offsite venue in Goa", "owner": "", "due": ""}],
    )]))
    m = generate_minutes(TRANSCRIPT, "transcript")
    assert m["decisions"] == ["Ship Postgres 16 for the reporting database"]
    assert [a["task"] for a in m["action_items"]] == ["Send the migration draft"]


def test_unsupported_summary_sections_are_dropped(no_background):
    set_provider(MockProvider([_reply(
        executive_summary=(
            "The team chose Postgres 16. The team hired three contractors for the mobile app."
        ),
        key_concepts=["Postgres 16", "Mobile app contractors"],
        important_points=["Reporting database moves to Postgres 16", "The offsite is in Goa"],
        open_questions=["Do we need read replicas?", "Who will manage the mobile app launch?"],
    )]))

    minutes = generate_minutes(TRANSCRIPT, "transcript")

    assert minutes["executive_summary"] == "The team chose Postgres 16."
    assert minutes["key_concepts"] == ["Postgres 16"]
    assert minutes["important_points"] == ["Reporting database moves to Postgres 16"]
    assert minutes["open_questions"] == ["Do we need read replicas?"]


def test_owner_requires_all_name_parts_to_appear_in_the_transcript(no_background):
    set_provider(MockProvider([_reply(action_items=[
        {"task": "Send the migration draft", "owner": "Priya Invented", "due": "Friday"},
    ])]))

    minutes = generate_minutes(TRANSCRIPT, "transcript")

    assert minutes["action_items"] == [{"task": "Send the migration draft", "owner": "", "due": "Friday"}]


def test_owner_and_due_are_kept_only_when_the_source_says_so(no_background):
    set_provider(MockProvider([_reply(action_items=[
        {"task": "Send the migration draft", "owner": "Meera", "due": "2026-10-09"},
    ])]))
    m = generate_minutes(TRANSCRIPT, "transcript")
    assert m["action_items"] == [{"task": "Send the migration draft", "owner": "", "due": ""}]


def test_a_recording_without_names_leaves_owners_empty(no_background):
    spoken = "I'll send the migration draft by Friday.\nAgreed, we ship Postgres 16 for the reporting database."
    set_provider(MockProvider([_reply(action_items=[{"task": "Send the migration draft", "owner": "Priya Sharma", "due": "Friday"}])]))
    m = generate_minutes(spoken, "recording")
    assert m["action_items"] == [{"task": "Send the migration draft", "owner": "", "due": "Friday"}]


def test_a_recording_that_names_someone_keeps_the_owner(no_background):
    spoken = "Priya will send the migration draft by Friday."
    set_provider(MockProvider([_reply(decisions=[], action_items=[{"task": "Send the migration draft", "owner": "Priya", "due": "Friday"}])]))
    m = generate_minutes(spoken, "recording")
    assert m["action_items"][0]["owner"] == "Priya"


def test_string_and_partial_action_items_are_normalised(no_background):
    set_provider(MockProvider([_reply(action_items=["Send the migration draft", {"task": "Send the migration draft by Friday"}])]))
    m = generate_minutes(TRANSCRIPT, "transcript")
    assert m["action_items"] == [
        {"task": "Send the migration draft", "owner": "", "due": ""},
        {"task": "Send the migration draft by Friday", "owner": "", "due": ""},
    ]


def test_a_long_transcript_is_split_then_merged(no_background, monkeypatch):
    monkeypatch.setattr(minutes_service, "MINUTES_PART_CHARS", 120)
    parts = split_transcript(TRANSCRIPT)
    assert len(parts) == 3
    provider = set_provider(MockProvider([_reply(), _reply(), _reply(), _reply(decisions=["Ship Postgres 16"])]))
    m = generate_minutes(TRANSCRIPT, "transcript")
    assert provider.call_count == len(parts) + 1
    assert "PARTIAL MINUTES" in provider.calls[-1]
    assert m["decisions"] == ["Ship Postgres 16"]


def test_split_keeps_lines_whole_and_cuts_one_giant_line():
    assert split_transcript("a\nb\nc", max_chars=3) == ["a", "b", "c"]
    assert split_transcript("x" * 7, max_chars=3) == ["xxx", "xxx", "x"]


def test_pii_never_reaches_the_model(no_background):
    provider = set_provider(MockProvider([_reply()]))
    generate_minutes(TRANSCRIPT + "\nPriya Sharma: mail me at priya@example.com", "transcript")
    assert "priya@example.com" not in provider.calls[0]


def test_minutes_endpoint_rejects_an_empty_transcript():
    from app.api.endpoints import MinutesRequest, generate_session_minutes

    with pytest.raises(HTTPException) as bad:
        generate_session_minutes(MinutesRequest(sessionId=1, groupId=1, transcript="   ", source="notes"))
    assert bad.value.status_code == 400
