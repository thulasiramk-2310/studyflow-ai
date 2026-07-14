import httpx
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.session import StudySession, SessionSummary, SummaryStatus
from datetime import datetime
import time
import os

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8002")

def generate_session_summary_task(session_id: int, group_id: int, resource_ids: list[int]):
    """
    Background task to generate a summary for a completed session.
    """
    db = SessionLocal()
    try:
        # Create or update summary record to GENERATING
        summary = db.query(SessionSummary).filter(SessionSummary.session_id == session_id).first()
        if not summary:
            summary = SessionSummary(session_id=session_id, status=SummaryStatus.GENERATING)
            db.add(summary)
        else:
            summary.status = SummaryStatus.GENERATING
        db.commit()
        db.refresh(summary)

        if not resource_ids:
            # Handle empty resources edge case without calling AI
            summary.summary = "No indexed study materials available for this session."
            summary.status = SummaryStatus.READY
            summary.generated_at = datetime.utcnow()
            db.commit()
            return

        # Call AI Service
        start_time = time.time()
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{AI_SERVICE_URL}/api/v1/ai/summary",
                    json={
                        "sessionId": session_id,
                        "groupId": group_id,
                        "resourceIds": resource_ids
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("success"):
                    summary_data = data.get("data", {})
                    summary.summary = summary_data.get("executive_summary")
                    summary.key_concepts = summary_data.get("key_concepts")
                    summary.important_points = summary_data.get("important_points")
                    summary.action_items = summary_data.get("action_items")
                    summary.status = SummaryStatus.READY
                    summary.model = summary_data.get("model", "qwen3:8b")
                else:
                    summary.status = SummaryStatus.FAILED
        except Exception as e:
            logger.error(f"Failed to generate summary for session {session_id}: {e}")
            summary.status = SummaryStatus.FAILED

        end_time = time.time()
        summary.generation_time_ms = int((end_time - start_time) * 1000)
        summary.generated_at = datetime.utcnow()
        db.commit()
        
        if summary.status == SummaryStatus.READY:
            from app.services.notification_service import notify_group_members
            from app.models.notification import NotificationType
            notify_group_members(
                db=db,
                group_id=group_id,
                title="Summary Ready",
                message="AI Summary is ready.",
                type=NotificationType.SUMMARY_READY,
                entity_type="SESSION",
                entity_id=session_id
            )

    finally:
        db.close()
