from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
import httpx
from pydantic import BaseModel, Field
from typing import Literal, List, Optional, Annotated

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

AI_SERVICE_URL = f"{settings.AI_SERVICE_URL}/api/v1/ai"

class ChatRequest(BaseModel):
    groupId: int = Field(gt=0)
    query: str = Field(min_length=1, max_length=8000)
    sessionId: Optional[int] = Field(default=None, gt=0)
    audience: Literal["student", "professional"] = "student"  # the asking user's account type

class RetrieveRequest(BaseModel):
    groupId: int = Field(gt=0)
    query: str = Field(min_length=1, max_length=8000)
    topK: int = Field(default=5, ge=1, le=20)
    resourceIds: Optional[List[Annotated[int, Field(gt=0)]]] = Field(default=None, max_length=100)

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

def upstream_error(response: httpx.Response) -> HTTPException:
    """Turn an ai-service error response into an HTTPException with a readable detail."""
    if response.status_code >= 500:
        return HTTPException(status_code=response.status_code, detail="AI is temporarily unavailable. Please try again in a minute.")
    try:
        detail = response.json().get("detail", response.text)
    except ValueError:
        detail = response.text
    return HTTPException(status_code=response.status_code, detail=detail)

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
            raise upstream_error(e.response)
        except Exception:
            logger.exception("AI chat request failed")
            raise HTTPException(status_code=503, detail="AI is temporarily unavailable. Please try again in a minute.")

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
            raise upstream_error(e.response)
        except Exception:
            logger.exception("AI retrieval request failed")
            raise HTTPException(status_code=503, detail="AI is temporarily unavailable. Please try again in a minute.")

@router.get("/chat/sessions")
@limiter.limit("60/minute")
async def get_chat_sessions(
    request: Request,
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0, le=10000)] = 0,
):
    user_id = current_user.get("userId")
    check_group_membership(db, group_id, user_id)
    
    headers = _internal_headers(request)
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.get(f"{AI_SERVICE_URL}/chat/sessions?group_id={group_id}&user_id={user_id}&limit={limit}&offset={offset}", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise upstream_error(e.response)
        except Exception:
            logger.exception("AI conversation list request failed")
            raise HTTPException(status_code=503, detail="AI is temporarily unavailable. Please try again in a minute.")

@router.get("/chat/sessions/{session_id}")
@limiter.limit("60/minute")
async def get_chat_session(
    request: Request,
    session_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    offset: Annotated[int, Query(ge=0, le=10000)] = 0,
    latest: bool = False,
    before_id: Annotated[Optional[int], Query(gt=0)] = None,
):
    user_id = current_user.get("userId")
    check_group_membership(db, group_id, user_id)
    
    headers = _internal_headers(request)
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            url = f"{AI_SERVICE_URL}/chat/sessions/{session_id}?group_id={group_id}&user_id={user_id}&limit={limit}&offset={offset}&latest={str(latest).lower()}"
            if before_id is not None:
                url += f"&before_id={before_id}"
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise upstream_error(e.response)
        except Exception:
            logger.exception("AI conversation request failed")
            raise HTTPException(status_code=503, detail="AI is temporarily unavailable. Please try again in a minute.")

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
            raise upstream_error(e.response)
        except Exception:
            logger.exception("AI conversation deletion failed")
            raise HTTPException(status_code=503, detail="AI is temporarily unavailable. Please try again in a minute.")
