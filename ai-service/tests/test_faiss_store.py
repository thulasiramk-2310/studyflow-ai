"""Concurrent indexing into one group must not lose vectors or chunk records."""

from __future__ import annotations

import threading
import time

import numpy as np

from app.core.config import settings
from app.vectorstore import faiss_store


def _chunks(n: int) -> list[dict]:
    return [{"page_num": 1, "text": f"chunk {i}"} for i in range(n)]


def _vectors(n: int, seed: int) -> np.ndarray:
    v = np.random.default_rng(seed).random((n, 8)).astype("float32")
    return v / np.linalg.norm(v, axis=1, keepdims=True)


def test_parallel_uploads_to_one_group_keep_every_chunk(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "AI_STORAGE_DIR", str(tmp_path))
    monkeypatch.setattr(faiss_store, "sync_group_index_from_s3", lambda *a, **k: None)
    monkeypatch.setattr(faiss_store, "sync_group_index_to_s3", lambda *a, **k: None)

    # Widen the read-modify-write window so an unguarded race shows up reliably.
    real_load = faiss_store.load_or_create_index

    def slow_load(*args):
        index = real_load(*args)
        time.sleep(0.2)
        return index

    monkeypatch.setattr(faiss_store, "load_or_create_index", slow_load)

    threads = [
        threading.Thread(target=faiss_store.add_to_index, args=(1, rid, f"notes{rid}.pdf", _chunks(3), _vectors(3, rid)))
        for rid in (1, 2)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    group_dir = faiss_store.get_group_dir(1)
    documents = faiss_store.load_documents(group_dir)
    index = faiss_store.load_or_create_index(group_dir, 8)

    assert index.ntotal == 6
    assert len(documents) == 6
    assert sorted(d["vector_id"] for d in documents) == list(range(6))
    assert faiss_store.load_metadata(group_dir)["total_chunks"] == 6


def test_writers_on_postgres_take_a_per_group_advisory_lock(monkeypatch):
    """Replicas don't share memory, so the write lock must live in the shared database."""
    calls: list[str] = []

    class FakeConn:
        def execute(self, statement, params=None):
            calls.append(f"{statement.text} {params}")

        def commit(self):
            pass

        def close(self):
            calls.append("close")

    class FakeEngine:
        dialect = type("D", (), {"name": "postgresql"})()

        def connect(self):
            return FakeConn()

    monkeypatch.setattr(faiss_store, "_lock_engine", lambda: FakeEngine())

    with faiss_store._group_write_lock(42):
        calls.append("write")

    assert calls[0].startswith("SELECT pg_advisory_lock(") and "42" in calls[0]
    assert calls[1] == "write"
    assert calls[2].startswith("SELECT pg_advisory_unlock(") and "42" in calls[2]
    assert calls[3] == "close"


def test_writers_without_postgres_fall_back_to_the_process_lock(monkeypatch):
    class SqliteEngine:
        dialect = type("D", (), {"name": "sqlite"})()

        def connect(self):
            raise AssertionError("no database lock expected")

    monkeypatch.setattr(faiss_store, "_lock_engine", lambda: SqliteEngine())

    with faiss_store._group_write_lock(1):
        pass
