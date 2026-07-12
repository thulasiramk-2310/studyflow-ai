from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.indexing import process_document
import os

router = APIRouter()

class IndexRequest(BaseModel):
    resource_id: int
    group_id: int
    file_path: str
    filename: str

@router.post("/index", status_code=202)
async def index_document(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Trigger document indexing asynchronously.
    """
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=400, detail="File path does not exist")
        
    background_tasks.add_task(process_document, request.resource_id, request.group_id, request.file_path, request.filename)
    return {"status": "Accepted", "message": f"Indexing started for resource {request.resource_id}"}

@router.post("/reindex/{resource_id}", status_code=202)
async def reindex_document(resource_id: int, request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Retry indexing a document.
    """
    if request.resource_id != resource_id:
        raise HTTPException(status_code=400, detail="Path parameter and body ID mismatch")
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=400, detail="File path does not exist")
        
    background_tasks.add_task(process_document, request.resource_id, request.group_id, request.file_path, request.filename)
    return {"status": "Accepted", "message": f"Reindexing started for resource {request.resource_id}"}

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "OK", "service": "ai-service"}

from app.schemas.retrieval import RetrieveRequest, RetrieveResponse, RetrieveResult, RetrieveSource
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import search_index, get_group_dir

@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_documents(request: RetrieveRequest):
    """
    Search the FAISS vector index for a group and return the top K matching chunks.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    group_dir = get_group_dir(request.groupId)
    index_path = group_dir / "index.faiss"
    
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="No vector index exists for this study group.")
        
    # Embed the query
    query_embeddings = generate_embeddings([request.query])
    
    # Perform similarity search
    results_raw = search_index(request.groupId, query_embeddings[0], request.topK)
    
    # Map to response format
    results = []
    for r in results_raw:
        # If requested resourceIds filter is present, filter it
        if request.resourceIds is not None and r["source"]["resourceId"] not in request.resourceIds:
            continue
            
        source = RetrieveSource(
            resourceId=r["source"]["resourceId"],
            filename=r["source"]["filename"],
            page=r["source"]["page"]
        )
        results.append(RetrieveResult(
            score=r["score"],
            content=r["content"],
            source=source
        ))
        
    return RetrieveResponse(
        success=True,
        query=request.query,
        results=results
    )

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag import generate_rag_response

@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    Generate an answer using RAG based on uploaded study materials.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    return generate_rag_response(request.groupId, request.query)
