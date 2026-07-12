from fastapi import APIRouter
from app.api.endpoints import router as ai_router

api_router = APIRouter()
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
