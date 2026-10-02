"""Test configuration.

Environment defaults are set before any app module is imported so
`app.core.config.Settings` constructs without real credentials. No test in this
suite reaches the network.
"""

from __future__ import annotations

import os
import tempfile

# Some modules create their storage directories at import time. Point them at a
# scratch directory so the suite never writes to /app (not writable in CI).
_TEST_DATA_DIR = tempfile.mkdtemp(prefix="ai-service-tests-")
os.environ["UPLOAD_PATH"] = os.path.join(_TEST_DATA_DIR, "uploads")
os.environ["AI_STORAGE_DIR"] = os.path.join(_TEST_DATA_DIR, "ai-storage")

os.environ.setdefault("DB_PASSWORD", "test-password")
os.environ.setdefault("INTERNAL_API_KEY", "test-internal-key")
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.pop("GROQ_API_KEY", None)

import pytest  # noqa: E402

from app.llm.provider import MockProvider, reset_provider  # noqa: E402


@pytest.fixture(autouse=True)
def _plan_store_in_memory():
    """MCP plans are stored in ai_db; tests get a private in-memory database."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.core.database import Base
    from app.mcp import plan_store

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    plan_store.use_session_factory(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    yield
    plan_store.use_session_factory(None)
    engine.dispose()


@pytest.fixture(autouse=True)
def _faiss_lock_without_postgres(monkeypatch):
    """FAISS writers take a Postgres advisory lock; tests have no Postgres."""
    from sqlalchemy import create_engine

    from app.vectorstore import faiss_store

    engine = create_engine("sqlite://")
    monkeypatch.setattr(faiss_store, "_lock_engine", lambda: engine)
    yield
    engine.dispose()


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
