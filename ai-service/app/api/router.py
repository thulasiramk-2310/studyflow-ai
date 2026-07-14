from fastapi import APIRouter
from app.api.endpoints import router as ai_router
from app.api.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(chat_router, prefix="/ai/chat", tags=["chat"])
