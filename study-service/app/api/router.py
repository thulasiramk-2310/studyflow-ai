from fastapi import APIRouter
from app.api.endpoints import groups, resources, sessions, users, ai, notifications, search

api_router = APIRouter()
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(search.router, prefix="/search", tags=["search"])

