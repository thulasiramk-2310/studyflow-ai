import httpx
from typing import List, Dict, Any, Optional
import os
from app.core.config import settings

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8080")

def _internal_headers() -> dict:
    """Headers for internal service-to-service calls."""
    return {"X-Internal-Key": settings.INTERNAL_API_KEY}

async def get_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a single user profile from the Auth Service."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/internal/users/{user_id}",
                headers=_internal_headers()
            )
            if response.status_code == 200:
                return response.json()
            return None
        except httpx.RequestError:
            return None

async def get_users_batch(user_ids: List[int]) -> List[Dict[str, Any]]:
    """Fetch a batch of user profiles from the Auth Service."""
    if not user_ids:
        return []
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/internal/users/batch",
                json=user_ids,
                headers=_internal_headers()
            )
            if response.status_code == 200:
                return response.json()
            return []
        except httpx.RequestError:
            return []
