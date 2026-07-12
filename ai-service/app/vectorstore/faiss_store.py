import os
import json
import faiss
import numpy as np
from pathlib import Path
from app.core.config import settings

def get_group_dir(group_id: int) -> Path:
    group_dir = Path(settings.AI_STORAGE_DIR) / f"group-{group_id}"
    group_dir.mkdir(parents=True, exist_ok=True)
    return group_dir

def load_or_create_index(group_dir: Path, dimension: int) -> faiss.IndexFlatL2:
    index_path = group_dir / "index.faiss"
    if index_path.exists():
        return faiss.read_index(str(index_path))
    return faiss.IndexFlatL2(dimension)

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

def add_to_index(group_id: int, resource_id: int, chunks: list[str], embeddings: np.ndarray):
    """
    Add new chunks and embeddings to the FAISS index for a specific group.
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
    
    # Check if resource already exists and remove it? For now, append.
    # If reindexing, we might have multiple copies if we don't clean up, but for phase 1 we just append.
    doc_entries = []
    for i, chunk in enumerate(chunks):
        doc_entries.append({
            "vector_id": start_idx + i,
            "resource_id": resource_id,
            "text": chunk
        })
    documents.extend(doc_entries)
    save_documents(group_dir, documents)
    
    # Update metadata
    metadata = load_metadata(group_dir)
    metadata["documents"] = len(set(d["resource_id"] for d in documents))
    metadata["total_chunks"] = index.ntotal
    save_metadata(group_dir, metadata)
