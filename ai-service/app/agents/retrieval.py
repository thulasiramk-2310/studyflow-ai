"""Retrieval seam for the agent graph.

The real implementations import sentence-transformers and FAISS lazily, so the
graph module can be imported (and unit-tested) without those heavy dependencies
being loaded or a vector index existing on disk.
"""

from __future__ import annotations

import logging
from typing import Any, Callable

logger = logging.getLogger(__name__)

# (group_id, query, top_k) -> list of {score, content, source{resourceId, filename, page}}
Retriever = Callable[[int, str, int], list[dict[str, Any]]]

# (group_id) -> list of {resource_id, filename, chunks}
IndexLister = Callable[[int], list[dict[str, Any]]]


def default_retriever(group_id: int, query: str, top_k: int = 3) -> list[dict[str, Any]]:
    """Embed the query and search the group's FAISS index."""
    from app.embeddings.embedding_service import generate_embeddings
    from app.services.s3_sync import sync_group_index_from_s3
    from app.vectorstore.faiss_store import get_group_dir, search_index

    group_dir = get_group_dir(group_id)
    sync_group_index_from_s3(group_id, group_dir)

    if not (group_dir / "index.faiss").exists():
        return []

    query_embeddings = generate_embeddings([query])
    return search_index(group_id, query_embeddings[0], top_k=top_k)


def default_index_lister(group_id: int) -> list[dict[str, Any]]:
    """Summarise what is indexed for a group, one entry per resource."""
    from app.services.s3_sync import sync_group_index_from_s3
    from app.vectorstore.faiss_store import get_group_dir, load_documents

    group_dir = get_group_dir(group_id)
    sync_group_index_from_s3(group_id, group_dir)

    documents = load_documents(group_dir)
    summary: dict[int, dict[str, Any]] = {}
    for doc in documents:
        resource_id = doc.get("resource_id")
        entry = summary.setdefault(
            resource_id,
            {"resource_id": resource_id, "filename": doc.get("filename", "unknown"), "chunks": 0},
        )
        entry["chunks"] += 1
    return sorted(summary.values(), key=lambda item: item["resource_id"] or 0)


def default_scheduler(context: str, target_duration: int = 60) -> dict[str, Any]:
    """Wrap the existing stateless schedule service. No persistence here -
    study-service stores the returned plan exactly as it does today."""
    from app.services.schedule import generate_schedule

    return generate_schedule(context, target_duration)
