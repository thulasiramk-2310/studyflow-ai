"""Test configuration.

Environment defaults are set before any app module is imported so
`app.core.config.Settings` constructs without real credentials. No test in this
suite reaches the network.
"""

from __future__ import annotations

import os

os.environ.setdefault("DB_PASSWORD", "test-password")
os.environ.setdefault("INTERNAL_API_KEY", "test-internal-key")
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.pop("GROQ_API_KEY", None)

import pytest  # noqa: E402

from app.llm.provider import MockProvider, reset_provider  # noqa: E402


@pytest.fixture(autouse=True)
def _clean_provider():
    """Never let a provider set by one test leak into the next."""
    reset_provider()
    yield
    reset_provider()


@pytest.fixture
def mock_llm() -> MockProvider:
    return MockProvider()


@pytest.fixture
def chunk():
    """Build a retrieval result in the shape `search_index` returns."""

    def _chunk(content: str, filename: str = "notes.pdf", page: int = 1, score: float = 0.9, resource_id: int = 1):
        return {
            "score": score,
            "content": content,
            "source": {"resourceId": resource_id, "filename": filename, "page": page},
        }

    return _chunk


@pytest.fixture
def stub_retriever(chunk):
    """Retriever returning a fixed list; records the calls it received."""

    def _make(results=None):
        results = results if results is not None else [chunk("Round Robin uses fixed time slices.")]
        calls: list[tuple] = []

        def _retriever(group_id, query, top_k=3):
            calls.append((group_id, query, top_k))
            return results

        _retriever.calls = calls
        return _retriever

    return _make
