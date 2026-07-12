import logging
import httpx
from fastapi import BackgroundTasks
from app.core.config import settings

logger = logging.getLogger(__name__)

def _trigger_ai_indexing(resource_id: int, group_id: int, file_path: str):
    """
    Internal task that makes the HTTP request to the AI service.
    """
    try:
        url = f"{settings.AI_SERVICE_URL}/api/v1/ai/index"
        payload = {
            "resource_id": resource_id,
            "group_id": group_id,
            "file_path": file_path
        }
        # Use httpx for a non-blocking request (though we are already in a background task)
        # We can just use a synchronous request here since it's a background thread
        with httpx.Client() as client:
            response = client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Triggered AI indexing for resource {resource_id}. Response: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to trigger AI indexing for resource {resource_id}: {e}")

def request_index(background_tasks: BackgroundTasks, resource_id: int, group_id: int, file_path: str):
    """
    Abstraction to request indexing for a resource.
    Currently triggers an HTTP request via background tasks.
    """
    logger.info(f"Queuing background task to request indexing for resource {resource_id}")
    background_tasks.add_task(_trigger_ai_indexing, resource_id, group_id, file_path)
