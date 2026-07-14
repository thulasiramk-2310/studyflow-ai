import os
import json
import faiss
import numpy as np
from pathlib import Path
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_group_dir(group_id: int) -> Path:
    group_dir = Path(settings.AI_STORAGE_DIR) / f"group-{group_id}"
    group_dir.mkdir(parents=True, exist_ok=True)
    return group_dir

def load_or_create_index(group_dir: Path, dimension: int) -> faiss.IndexFlatIP:
    index_path = group_dir / "index.faiss"
    if index_path.exists():
        return faiss.read_index(str(index_path))
    # We use IndexFlatIP for Cosine Similarity (requires normalized vectors)
    return faiss.IndexFlatIP(dimension)

def save_index(group_dir: Path, index: faiss.Index):
    index_path = group_dir / "index.faiss"
    faiss.write_index(index, str(index_path))

def load_metadata(group_dir: Path) -> dict:
    metadata_path = group_dir / "metadata.json"
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return {
        "embedding_model": settings.EMBEDDING_MODEL,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "documents": 0,
        "total_chunks": 0
    }

def save_metadata(group_dir: Path, metadata: dict):
    metadata_path = group_dir / "metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

def load_documents(group_dir: Path) -> list:
    docs_path = group_dir / "documents.json"
    if docs_path.exists():
        with open(docs_path, 'r') as f:
            return json.load(f)
    return []

def save_documents(group_dir: Path, documents: list):
    docs_path = group_dir / "documents.json"
    with open(docs_path, 'w') as f:
        json.dump(documents, f, indent=2)

def add_to_index(group_id: int, resource_id: int, filename: str, chunks: list[dict], embeddings: np.ndarray):
    """
    Add new chunks and embeddings to the FAISS index for a specific group.
    `chunks` is a list of dicts: [{"page_num": int, "text": str}]
    """
    group_dir = get_group_dir(group_id)
    
    # Load or create
    dimension = embeddings.shape[1]
    index = load_or_create_index(group_dir, dimension)
    
    # Add vectors
    start_idx = index.ntotal
    index.add(embeddings)
    
    # Save index
    save_index(group_dir, index)
    
    # Update documents tracking
    documents = load_documents(group_dir)
    
    doc_entries = []
    for i, chunk in enumerate(chunks):
        doc_entries.append({
            "vector_id": start_idx + i,
            "resource_id": resource_id,
            "filename": filename,
            "page": chunk["page_num"],
            "text": chunk["text"]
        })
    documents.extend(doc_entries)
    save_documents(group_dir, documents)
    
    # Update metadata
    metadata = load_metadata(group_dir)
    metadata["documents"] = len(set(d["resource_id"] for d in documents))
    metadata["total_chunks"] = index.ntotal
    save_metadata(group_dir, metadata)


def search_index(group_id: int, query_embedding: np.ndarray, top_k: int = 5, threshold: float = 0.2, resource_ids: list[int] = None) -> list[dict]:
    """
    Search the FAISS index for a given group and return the top K matching chunks.
    Optionally filter by resource_ids.
    """
    group_dir = get_group_dir(group_id)
    index_path = group_dir / "index.faiss"
    
    if not index_path.exists():
        logger.warning(f"No index found for group {group_id}")
        return []
        
    index = faiss.read_index(str(index_path))
    documents = load_documents(group_dir)
    
    # Ensure query embedding is 2D
    if len(query_embedding.shape) == 1:
        query_embedding = query_embedding.reshape(1, -1)
        
    # Search FAISS (fetch more if filtering)
    fetch_k = top_k * 5 if resource_ids else top_k
    scores, indices = index.search(query_embedding, fetch_k)
    
    results = []
    for i in range(len(indices[0])):
        idx = int(indices[0][i])
        if idx == -1:
            continue
            
        score = float(scores[0][i])
        if score < threshold:
            continue
            
        doc = next((d for d in documents if d["vector_id"] == idx), None)
        if doc:
            if resource_ids and doc["resource_id"] not in resource_ids:
                continue
                
            results.append({
                "score": score,
                "content": doc["text"],
                "source": {
                    "resourceId": doc["resource_id"],
                    "filename": doc.get("filename", "unknown"),
                    "page": doc.get("page", 1)
                }
            })
            
            if len(results) >= top_k:
                break
            
    return results
