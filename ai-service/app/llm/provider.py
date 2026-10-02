"""LLM provider indirection.

Every LLM call in the service goes through a provider obtained from
`get_provider()`. Production uses `GroqProvider`; tests and offline evals use
`MockProvider`, which never touches the network. This keeps the call site
identical in both cases, so no test needs to patch module internals.
"""

from __future__ import annotations

import logging
import time
from collections import deque
from typing import Iterable, Optional, Protocol, runtime_checkable

import requests
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
AI_UNAVAILABLE_DETAIL = "AI is temporarily unavailable. Please try again in a minute."
# Room for long JSON answers (quizzes, flashcards) plus the reasoning tokens gpt-oss spends first.
MAX_COMPLETION_TOKENS = 8192
# Free-tier rate limits clear within seconds; wait once, briefly, before giving up.
RATE_LIMIT_MAX_WAIT_SECONDS = 10.0
RATE_LIMIT_DEFAULT_WAIT_SECONDS = 2.0


@runtime_checkable
class LLMProvider(Protocol):
    """Minimal contract every provider implements."""

    name: str

    def complete(self, prompt: str) -> str:
        """Send a stateless prompt and return the generated text."""
        ...


class GroqProvider:
    """Calls the Groq chat-completions API. Behaviour matches the original
    `llm_service.generate_answer` exactly, including the HTTP error mapping."""

    name = "groq"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout: float = 30.0):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.timeout = timeout

    def complete(self, prompt: str) -> str:
        if not self.api_key:
            raise HTTPException(status_code=503, detail="LLM provider is not configured (missing GROQ_API_KEY)")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "max_completion_tokens": MAX_COMPLETION_TOKENS,
        }
        if "gpt-oss" in self.model:
            payload["reasoning_effort"] = "low"

        try:
            logger.info(f"Sending prompt to Groq ({self.model})")
            response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=self.timeout)
            if response.status_code == 429:
                wait = _retry_after_seconds(response)
                logger.warning(f"Groq rate limit hit; retrying once in {wait:.1f}s")
                time.sleep(wait)
                response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        except requests.exceptions.Timeout:
            logger.error("Groq service timed out.")
            raise HTTPException(status_code=503, detail=AI_UNAVAILABLE_DETAIL)
        except requests.exceptions.RequestException as e:
            # Covers HTTP errors (429 quota, 5xx) and connection failures.
            logger.error(f"Failed to communicate with Groq: {e}")
            raise HTTPException(status_code=503, detail=AI_UNAVAILABLE_DETAIL)


def _retry_after_seconds(response) -> float:
    try:
        wait = float(response.headers.get("retry-after", RATE_LIMIT_DEFAULT_WAIT_SECONDS))
    except (TypeError, ValueError):
        wait = RATE_LIMIT_DEFAULT_WAIT_SECONDS
    return max(0.0, min(wait, RATE_LIMIT_MAX_WAIT_SECONDS))


class MockProvider:
    """Scripted provider for tests and offline evals.

    Replies are drained from `responses` in order. Once the script is empty
    every further call returns `default`. Prompts are recorded on `.calls` so
    tests can assert what actually reached the model.
    """

    name = "mock"

    def __init__(self, responses: Optional[Iterable[str]] = None, default: str = "MOCK_ANSWER"):
        self._queue = deque(responses or [])
        self.default = default
        self.calls: list[str] = []

    def complete(self, prompt: str) -> str:
        self.calls.append(prompt)
        if self._queue:
            return self._queue.popleft()
        return self.default

    def queue(self, *responses: str) -> "MockProvider":
        self._queue.extend(responses)
        return self

    @property
    def call_count(self) -> int:
        return len(self.calls)


_provider: Optional[LLMProvider] = None


def _build_default_provider() -> LLMProvider:
    configured = (settings.LLM_PROVIDER or "groq").strip().lower()
    if configured == "mock":
        logger.warning("LLM_PROVIDER=mock - no real model will be called")
        return MockProvider()
    return GroqProvider()


def get_provider() -> LLMProvider:
    """Return the process-wide provider, building the configured one on first use."""
    global _provider
    if _provider is None:
        _provider = _build_default_provider()
    return _provider


def set_provider(provider: LLMProvider) -> LLMProvider:
    """Override the provider. Used by tests, evals and the mock CLI flag."""
    global _provider
    _provider = provider
    return provider


def reset_provider() -> None:
    """Drop the cached provider so the next `get_provider()` rebuilds it."""
    global _provider
    _provider = None
