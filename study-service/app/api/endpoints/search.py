from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.search import SearchResponse
from app.services import search_service

router = APIRouter()

@router.get("/", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    results = search_service.search_content(db, current_user["userId"], q, limit)
    return results
