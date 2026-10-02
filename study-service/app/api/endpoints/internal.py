"""Service-to-service endpoints (X-Internal-Key)."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.services.account_cleanup import OwnsSharedGroups, remove_user_data

router = APIRouter()


@router.delete("/users/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db), internal_key: str = Header(None, alias="X-Internal-Key")):
    """Called by auth-service before it deletes an account."""
    if internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        deleted = remove_user_data(db, user_id)
    except OwnsSharedGroups as e:
        raise HTTPException(
            status_code=409,
            detail=f"You own groups with other members: {', '.join(e.names)}. Delete them or remove the other members first.",
        )
    return {"deleted_groups": deleted}
