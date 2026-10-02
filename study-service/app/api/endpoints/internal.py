"""Service-to-service endpoints (X-Internal-Key)."""

import logging

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.services.account_cleanup import OwnsSharedGroups, remove_user_data

router = APIRouter()
logger = logging.getLogger(__name__)


def delete_ai_history(user_id: int) -> None:
    """Delete the user's Ask AI chats and MCP plans in ai-service. Raises on any failure."""
    response = httpx.delete(
        f"{settings.AI_SERVICE_URL}/api/v1/ai/chat/users/{user_id}",
        headers={"X-Internal-Key": settings.INTERNAL_API_KEY},
        timeout=15.0,
    )
    response.raise_for_status()


@router.delete("/users/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db), internal_key: str = Header(None, alias="X-Internal-Key")):
    """Called by auth-service before it deletes an account."""
    if internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        deleted = remove_user_data(db, user_id, before_delete=delete_ai_history)
    except OwnsSharedGroups as e:
        raise HTTPException(
            status_code=409,
            detail=f"You own groups with other members: {', '.join(e.names)}. Delete them or remove the other members first.",
        )
    except Exception as e:
        logger.error("Account cleanup stopped before deleting anything: %s", type(e).__name__)
        raise HTTPException(status_code=503, detail="Couldn't remove your AI history right now. Nothing was deleted; try again.")
    return {"deleted_groups": deleted}
