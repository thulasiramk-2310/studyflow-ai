from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.indexing import process_document
import os

router = APIRouter()

class IndexRequest(BaseModel):
    resource_id: int
    group_id: int
    file_path: str

@router.post("/index", status_code=202)
async def index_document(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Trigger document indexing asynchronously.
    """
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=400, detail="File path does not exist")
        
    background_tasks.add_task(process_document, request.resource_id, request.group_id, request.file_path)
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
        
    background_tasks.add_task(process_document, request.resource_id, request.group_id, request.file_path)
    return {"status": "Accepted", "message": f"Reindexing started for resource {request.resource_id}"}

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "OK", "service": "ai-service"}
