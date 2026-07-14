from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import httpx
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.group import GroupMember
from app.core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

AI_SERVICE_URL = "http://ai-service:8002/api/v1/ai"

class ChatRequest(BaseModel):
    groupId: int
    query: str
    sessionId: Optional[int] = None

class RetrieveRequest(BaseModel):
    groupId: int
    query: str
    topK: int = 5
    resourceIds: Optional[List[int]] = None

def check_group_membership(db: Session, group_id: int, user_id: int):
    member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return member

def _internal_headers(request: Request) -> dict:
    """Build internal service-to-service headers."""
    return {
        "X-Request-ID": getattr(request.state, "request_id", ""),
        "X-Internal-Key": settings.INTERNAL_API_KEY,
    }

@router.post("/chat")
@limiter.limit("20/minute")
async def chat_with_documents(
    request: Request,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    check_group_membership(db, payload.groupId, user_id)
    
    headers = _internal_headers(request)
    payload_dict = payload.model_dump()
    payload_dict["userId"] = user_id

    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.post(f"{AI_SERVICE_URL}/chat", json=payload_dict, timeout=60.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")

@router.post("/retrieve")
@limiter.limit("60/minute")
async def retrieve_documents(
    request: Request,
    payload: RetrieveRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    check_group_membership(db, payload.groupId, user_id)
    
    headers = _internal_headers(request)
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.post(f"{AI_SERVICE_URL}/retrieve", json=payload.model_dump(), timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")

@router.get("/chat/sessions")
@limiter.limit("60/minute")
async def get_chat_sessions(
    request: Request,
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    check_group_membership(db, group_id, user_id)
    
    headers = _internal_headers(request)
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.get(f"{AI_SERVICE_URL}/chat/sessions?group_id={group_id}&user_id={user_id}", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")

@router.get("/chat/sessions/{session_id}")
@limiter.limit("60/minute")
async def get_chat_session(
    request: Request,
    session_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    check_group_membership(db, group_id, user_id)
    
    headers = _internal_headers(request)
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.get(f"{AI_SERVICE_URL}/chat/sessions/{session_id}?group_id={group_id}&user_id={user_id}", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")

@router.delete("/chat/sessions/{session_id}")
@limiter.limit("30/minute")
async def delete_chat_session(
    request: Request,
    session_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    check_group_membership(db, group_id, user_id)
    
    headers = _internal_headers(request)
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.delete(f"{AI_SERVICE_URL}/chat/sessions/{session_id}?group_id={group_id}&user_id={user_id}", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Service Error: {str(e)}")
