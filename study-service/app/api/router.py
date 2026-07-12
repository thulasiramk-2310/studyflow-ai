from fastapi import APIRouter
from app.api.endpoints import groups, resources, sessions

api_router = APIRouter()
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
