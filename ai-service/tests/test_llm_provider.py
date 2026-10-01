"""Provider indirection: the seam every other test depends on."""

from __future__ import annotations

import pytest
import requests
from fastapi import HTTPException

from app.llm.provider import (
    AI_UNAVAILABLE_DETAIL,
    GroqProvider,
    LLMProvider,
    MockProvider,
    get_provider,
    reset_provider,
    set_provider,
)


def test_mock_provider_returns_scripted_replies_in_order():
    provider = MockProvider(responses=["first", "second"])

    assert provider.complete("a") == "first"
    assert provider.complete("b") == "second"


def test_mock_provider_falls_back_to_default_when_script_is_exhausted():
    provider = MockProvider(responses=["only"], default="fallback")

    provider.complete("a")

    assert provider.complete("b") == "fallback"
    assert provider.complete("c") == "fallback"


def test_mock_provider_records_prompts():
    provider = MockProvider()

    provider.complete("what is paging?")

    assert provider.calls == ["what is paging?"]
    assert provider.call_count == 1


def test_both_providers_satisfy_the_protocol():
    assert isinstance(MockProvider(), LLMProvider)
    assert isinstance(GroqProvider(api_key="x"), LLMProvider)


def test_groq_provider_raises_503_without_a_key_instead_of_calling_out():
    provider = GroqProvider(api_key="")

    with pytest.raises(HTTPException) as exc:
        provider.complete("hello")

    assert exc.value.status_code == 503


def test_factory_honours_llm_provider_setting(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")
    reset_provider()

    assert get_provider().name == "mock"


def test_set_provider_overrides_the_factory():
    provider = MockProvider(responses=["injected"])
    set_provider(provider)

    assert get_provider() is provider


def test_llm_service_delegates_to_the_active_provider():
    """The six existing callers import `generate_answer`; it must follow the
    provider override without any of them being patched."""
    from app.services.llm_service import generate_answer

    set_provider(MockProvider(responses=["routed through the provider"]))

    assert generate_answer("prompt") == "routed through the provider"



class _FakeResponse:
    def __init__(self, status_code: int):
        self.status_code = status_code

    def raise_for_status(self):
        raise requests.exceptions.HTTPError(f"{self.status_code} error", response=self)

    def json(self):
        return {}


@pytest.mark.parametrize(
    "failure",
    [
        _FakeResponse(429),
        _FakeResponse(500),
        requests.exceptions.Timeout("slow"),
        requests.exceptions.ConnectionError("down"),
    ],
)
def test_groq_failures_map_to_a_single_503(monkeypatch, failure):
    def fake_post(*args, **kwargs):
        if isinstance(failure, Exception):
            raise failure
        return failure

    monkeypatch.setattr("app.llm.provider.requests.post", fake_post)
    provider = GroqProvider(api_key="test-key")

    with pytest.raises(HTTPException) as exc:
        provider.complete("hello")

    assert exc.value.status_code == 503
    assert exc.value.detail == AI_UNAVAILABLE_DETAIL
