import httpx
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.session import StudySession, SessionSummary, SummaryStatus
from app.core.config import settings
from datetime import datetime
import time
import os
from app.services.audience import group_audience

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8002")

def generate_session_summary_task(session_id: int, group_id: int, resource_ids: list[int]):
    """
    Background task to generate a summary for a completed session.

    With a meeting transcript the summary is minutes of what was said, written
    as a draft for the organizer to approve. Without one it summarises the
    attached documents, as before.
    """
    db = SessionLocal()
    try:
        session = db.query(StudySession).filter(StudySession.id == session_id).first()
        transcript = session.meeting_transcript if session else None

        # Create or update summary record to GENERATING
        summary = db.query(SessionSummary).filter(SessionSummary.session_id == session_id).first()
        if not summary:
            summary = SessionSummary(session_id=session_id, status=SummaryStatus.GENERATING, started_at=datetime.utcnow())
            db.add(summary)
        else:
            summary.status = SummaryStatus.GENERATING
            summary.started_at = datetime.utcnow()
        audience = group_audience(db, group_id)
        summary.audience = audience
        summary.review_status = None
        summary.approved_by = None
        summary.approved_at = None
        db.commit()
        db.refresh(summary)

        if not transcript and not resource_ids:
            # Handle empty resources edge case without calling AI
            summary.summary = "No indexed study materials available for this session."
            summary.source = None
            summary.decisions = None
            summary.open_questions = None
            summary.status = SummaryStatus.READY
            summary.generated_at = datetime.utcnow()
            db.commit()
            return

        if transcript:
            endpoint, timeout = "/api/v1/ai/minutes", 300.0
            payload = {
                "sessionId": session_id,
                "groupId": group_id,
                "transcript": transcript,
                "source": session.meeting_transcript_source or "notes",
                "resourceIds": resource_ids,
                "audience": audience,
            }
        else:
            endpoint, timeout = "/api/v1/ai/summary", 120.0
            payload = {"sessionId": session_id, "groupId": group_id, "resourceIds": resource_ids, "audience": audience}

        # Call AI Service
        start_time = time.time()
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    f"{AI_SERVICE_URL}{endpoint}",
                    headers={"X-Internal-Key": settings.INTERNAL_API_KEY},
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

                if data.get("success"):
                    summary_data = data.get("data", {})
                    summary.summary = summary_data.get("executive_summary")
                    summary.key_concepts = summary_data.get("key_concepts")
                    summary.important_points = summary_data.get("important_points")
                    summary.action_items = summary_data.get("action_items")
                    summary.decisions = summary_data.get("decisions") if transcript else None
                    summary.open_questions = summary_data.get("open_questions") if transcript else None
                    summary.source = session.meeting_transcript_source if transcript else None
                    summary.source_by = session.meeting_transcript_by if transcript else None
                    summary.review_status = "DRAFT" if transcript else None
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

        # Minutes are announced when the organizer approves them, not as a draft.
        if summary.status == SummaryStatus.READY and not transcript:
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
