import json
import logging
import httpx
from sqlalchemy.orm import Session
from app.models.session import StudySession, SessionStatus
from app.models.group import StudyGroup
from app.models.resource import Resource
from app.core.config import settings
from fastapi import HTTPException

logger = logging.getLogger(__name__)

async def generate_agentic_schedule(db: Session, group_id: int) -> dict:
    # 1. Fetch group resources
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    resources = db.query(Resource).filter(Resource.group_id == group_id).all()
    resource_names = [r.filename for r in resources]
    
    # 2. Fetch past sessions
    sessions = db.query(StudySession).filter(StudySession.group_id == group_id).order_by(StudySession.scheduled_at.asc()).all()
    
    # 3. Check for any SCHEDULED sessions
    pending_sessions = [s for s in sessions if s.status == SessionStatus.SCHEDULED]
    if pending_sessions:
        raise HTTPException(status_code=400, detail="A scheduled session already exists for this group. Complete or cancel it first.")
        
    completed_sessions = [s for s in sessions if s.status == SessionStatus.COMPLETED]
    
    # 4. Build Context String
    context_lines = []
    context_lines.append(f"Available Resources: {', '.join(resource_names) if resource_names else 'None'}")
    context_lines.append(f"Session Duration History (minutes): {', '.join([str(s.duration_minutes) for s in completed_sessions])}")
    
    context_lines.append("\nCompleted Sessions:")
    for idx, s in enumerate(completed_sessions):
        context_lines.append(f"\n{idx+1}. {s.title}")
        if s.summary and s.summary.summary:
            context_lines.append(f"   Summary: {s.summary.summary}")
        else:
            context_lines.append("   Summary: None")
            
        # Simulate quiz score / flashcards for now if we don't have detailed DB tracking
        # We can add actual DB queries here later if we fully implement QuizScores.
        if s.quiz:
            context_lines.append(f"   Quiz Status: {s.quiz.status.value}")
        if s.flashcard_deck:
            context_lines.append(f"   Flashcards Status: {s.flashcard_deck.status.value}")

    context_str = "\n".join(context_lines)
    
    # 5. Call AI Service
    ai_url = f"{settings.AI_SERVICE_URL}/api/v1/ai/schedule"
    headers = {"X-Internal-Key": settings.INTERNAL_API_KEY}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                ai_url,
                json={"context": context_str},
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            if data.get("success") and "data" in data:
                return data["data"]
            else:
                raise ValueError("Invalid response from AI service")
        except Exception as e:
            logger.error(f"Failed to fetch schedule from AI service: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate AI schedule")
