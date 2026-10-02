"""Every LLM call - not just chat - must see masked text, and logs must not keep prompts or model output."""

from __future__ import annotations

import logging

from app.llm.provider import MockProvider, set_provider
from app.services.llm_service import generate_answer

SECRET_EMAIL = "riya.sharma@college.edu"
SECRET_PHONE = "9876543210"


def test_generate_answer_masks_pii_before_the_model_sees_it():
    provider = MockProvider(default="ok")
    set_provider(provider)

    generate_answer(f"Notes from {SECRET_EMAIL}, call {SECRET_PHONE} about deadlocks.")

    sent = provider.calls[0]
    assert SECRET_EMAIL not in sent and SECRET_PHONE not in sent
    assert "[EMAIL]" in sent and "[PHONE]" in sent


def test_schedule_generation_does_not_log_the_prompt_or_plan(caplog):
    from app.services.schedule import generate_schedule

    set_provider(MockProvider(default='{"title": "Deadlocks with Riya", "duration_minutes": 60}'))
    with caplog.at_level(logging.DEBUG):
        generate_schedule(f"Group context mentions {SECRET_EMAIL}")

    assert "Deadlocks with Riya" not in caplog.text
    assert "Group context" not in caplog.text


def test_unparseable_quiz_output_is_not_logged(caplog, monkeypatch):
    from app.services import quiz

    monkeypatch.setattr(quiz, "generate_embeddings", lambda texts: [[0.0]])
    monkeypatch.setattr(quiz, "search_index", lambda **kwargs: [{"content": "Deadlock needs four conditions."}])
    set_provider(MockProvider(default="not json, secret model output"))

    with caplog.at_level(logging.DEBUG):
        try:
            quiz.generate_quiz(group_id=1, resource_ids=[1])
        except Exception:
            pass

    assert "secret model output" not in caplog.text
