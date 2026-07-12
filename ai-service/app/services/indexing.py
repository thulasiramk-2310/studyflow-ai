import logging
import requests
import time
from app.core.config import settings
from app.loaders.document_loader import extract_text_from_document
from app.chunking.splitter import chunk_text
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import add_to_index

logger = logging.getLogger(__name__)

def update_resource_status(resource_id: int, status: str):
    """
    Call study-service to update the resource status.
    """
    try:
        url = f"{settings.STUDY_SERVICE_URL}/resources/{resource_id}/status"
        response = requests.put(url, json={"status": status})
        response.raise_for_status()
        logger.info(f"Updated resource {resource_id} status to {status}")
    except Exception as e:
        logger.error(f"Failed to update resource {resource_id} status to {status}: {e}")

def process_document(resource_id: int, group_id: int, file_path: str, filename: str):
    """
    Main ingestion pipeline to extract, chunk, embed, and store document.
    """
    start_time = time.time()
    try:
        logger.info(f"Starting ingestion for resource {resource_id} (Group: {group_id})")
        
        # 1. Extract Text
        pages = extract_text_from_document(file_path)
        
        # 2. Chunk Text
        chunks = chunk_text(pages)
        if not chunks:
            logger.warning(f"No text extracted for resource {resource_id}")
            update_resource_status(resource_id, "INDEXED")
            return
            
        # 3. Generate Embeddings
        embed_start = time.time()
        # Only pass the text part of the chunks for embedding
        chunk_texts = [c["text"] for c in chunks]
        embeddings = generate_embeddings(chunk_texts)
        embed_time = time.time() - embed_start
        
        # 4. Store in FAISS
        add_to_index(group_id, resource_id, filename, chunks, embeddings)
        
        # 5. Mark as INDEXED
        update_resource_status(resource_id, "INDEXED")
        
        total_time = time.time() - start_time
        logger.info(
            f"Ingestion complete | Document ID: {resource_id} | Group ID: {group_id} | "
            f"Chunks Created: {len(chunks)} | Embedding Time: {embed_time:.2f}s | "
            f"Total Time: {total_time:.2f}s | Index Saved"
        )
        
    except Exception as e:
        logger.error(f"Ingestion failed for resource {resource_id}: {e}", exc_info=True)
        update_resource_status(resource_id, "FAILED")
