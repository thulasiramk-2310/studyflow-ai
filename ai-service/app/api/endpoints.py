from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Literal
from app.services.indexing import process_document
from app.services.summary import generate_summary
from app.core.config import settings
import os

def verify_internal_key(x_internal_key: str = Header(...)):
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal key")

router = APIRouter(dependencies=[Depends(verify_internal_key)])

class IndexRequest(BaseModel):
    resource_id: int
    group_id: int
    file_path: str
    filename: str

@router.post("/index", status_code=202)
def index_document(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Trigger document indexing asynchronously.
    """
    # Removed local file check since file_path might be an S3 key
        
    background_tasks.add_task(process_document, request.resource_id, request.group_id, request.file_path, request.filename)
    return {"status": "Accepted", "message": f"Indexing started for resource {request.resource_id}"}

@router.post("/reindex/{resource_id}", status_code=202)
def reindex_document(resource_id: int, request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Retry indexing a document.
    """
    if request.resource_id != resource_id:
        raise HTTPException(status_code=400, detail="Path parameter and body ID mismatch")
    # Removed local file check since file_path might be an S3 key
        
    background_tasks.add_task(process_document, request.resource_id, request.group_id, request.file_path, request.filename)
    return {"status": "Accepted", "message": f"Reindexing started for resource {request.resource_id}"}



from app.schemas.retrieval import RetrieveRequest, RetrieveResponse, RetrieveResult, RetrieveSource
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import search_index, get_group_dir

@router.post("/retrieve", response_model=RetrieveResponse)
def retrieve_documents(request: RetrieveRequest):
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

# Chat endpoint moved to api/chat.py

import logging
logger = logging.getLogger(__name__)

class SummaryRequest(BaseModel):
    sessionId: int
    groupId: int
    resourceIds: List[int]
    audience: Literal["student", "professional"] = "student"

@router.post("/summary")
def generate_session_summary(req: SummaryRequest):
    try:
        summary_data = generate_summary(group_id=req.groupId, resource_ids=req.resourceIds, audience=req.audience)
        return {"success": True, "data": summary_data}
    except ValueError as e:
        # e.g. "No indexed study materials" or parsing failures
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in generate_session_summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class QuizRequest(BaseModel):
    sessionId: int
    groupId: int
    resourceIds: List[int]
    audience: Literal["student", "professional"] = "student"

@router.post("/quiz")
def generate_session_quiz(req: QuizRequest):
    try:
        from app.services.quiz import generate_quiz
        quiz_data = generate_quiz(group_id=req.groupId, resource_ids=req.resourceIds, audience=req.audience)
        return {"success": True, "data": quiz_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in generate_session_quiz: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class FlashcardRequest(BaseModel):
    sessionId: int
    groupId: int
    resourceIds: List[int]
    count: int = 15
    audience: Literal["student", "professional"] = "student"

@router.post("/flashcards")
def generate_session_flashcards(req: FlashcardRequest):
    try:
        from app.services.flashcard import generate_flashcards
        flashcard_data = generate_flashcards(group_id=req.groupId, resource_ids=req.resourceIds, count=req.count, audience=req.audience)
        return {"success": True, "data": flashcard_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in generate_session_flashcards: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class ScheduleRequest(BaseModel):
    context: str
    target_duration: int = 60
    audience: Literal["student", "professional"] = "student"

@router.post("/schedule")
def generate_session_schedule(req: ScheduleRequest):
    try:
        from app.services.schedule import generate_schedule
        schedule_data = generate_schedule(req.context, req.target_duration, audience=req.audience)
        return {"success": True, "data": schedule_data}
    except Exception as e:
        logger.error(f"Error in generate_session_schedule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


import base64
import binascii

from app.services.transcript import parse_transcript


class TranscriptParseRequest(BaseModel):
    filename: str
    content_base64: str


@router.post("/transcript/parse")
def parse_meeting_transcript(req: TranscriptParseRequest):
    try:
        data = base64.b64decode(req.content_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="The file could not be decoded.")
    try:
        text = parse_transcript(req.filename, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"success": True, "data": {"text": text}}
