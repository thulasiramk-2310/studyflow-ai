"""Guardrail 2: PII masking."""

from __future__ import annotations

import logging

import pytest

from app.guardrails.pii import mask_all, mask_pii


@pytest.mark.parametrize(
    "raw",
    ["9876543210", "+91 9876543210", "+91-9876543210", "09876543210", "6123456789"],
)
def test_indian_mobile_numbers_are_masked(raw):
    assert "[PHONE]" in mask_pii(f"call me on {raw} please").text


@pytest.mark.parametrize("raw", ["1234567890", "5123456789"])
def test_numbers_that_are_not_indian_mobiles_are_left_alone(raw):
    """10 digits starting 0-5 is not a mobile number."""
    assert "[PHONE]" not in mask_pii(f"the value {raw} appears in the table").text


@pytest.mark.parametrize("raw", ["student@example.com", "first.last+tag@sub.domain.co.in"])
def test_emails_are_masked(raw):
    result = mask_pii(f"mail {raw} today")

    assert "[EMAIL]" in result.text
    assert raw not in result.text


@pytest.mark.parametrize("raw", ["123412341234", "1234 5678 9012", "1234-5678-9012"])
def test_aadhaar_numbers_are_masked(raw):
    result = mask_pii(f"my id is {raw}")

    assert "[ID]" in result.text
    assert "[PHONE]" not in result.text


def test_aadhaar_is_not_chopped_into_a_phone_match():
    """12 digits must mask as one [ID], never [PHONE] plus leftovers."""
    result = mask_pii("987654321012")

    assert result.text == "[ID]"


def test_all_three_types_in_one_message():
    result = mask_pii("reach me at 9876543210 or a@b.com, aadhaar 1234 5678 9012")

    assert "[PHONE]" in result.text
    assert "[EMAIL]" in result.text
    assert "[ID]" in result.text
    assert result.counts == {"email": 1, "id": 1, "phone": 1}


def test_clean_text_is_unchanged():
    result = mask_pii("What is Round Robin scheduling?")

    assert result.text == "What is Round Robin scheduling?"
    assert result.masked is False


def test_masking_is_logged_without_the_values(caplog):
    with caplog.at_level(logging.INFO, logger="app.guardrails.pii"):
        mask_pii("call 9876543210")

    assert "PII masked before LLM call" in caplog.text
    assert "9876543210" not in caplog.text


def test_empty_input_is_safe():
    assert mask_pii("").text == ""


def test_mask_all_masks_every_chunk_and_totals_the_counts():
    masked, totals = mask_all(["call 9876543210", "mail a@b.com", "clean chunk"])

    assert masked[0] == "call [PHONE]"
    assert masked[1] == "mail [EMAIL]"
    assert masked[2] == "clean chunk"
    assert totals == {"email": 1, "id": 0, "phone": 1}


def test_retrieved_chunks_are_masked_before_reaching_the_llm(stub_retriever, chunk):
    """PII in an uploaded PDF must not be forwarded to the model."""
    from app.agents.nodes import rag_node
    from app.agents.state import new_state
    from app.llm.provider import MockProvider

    provider = MockProvider(responses=["answer"])
    retriever = stub_retriever([chunk("Contact the tutor on 9876543210 or tutor@uni.edu")])

    rag_node(new_state(group_id=1, message="who do I contact?"), provider=provider, retriever=retriever)

    prompt = provider.calls[0]
    assert "9876543210" not in prompt
    assert "tutor@uni.edu" not in prompt
    assert "[PHONE]" in prompt and "[EMAIL]" in prompt
