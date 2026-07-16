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

async def generate_agentic_schedule(db: Session, group_id: int, target_duration_minutes: int) -> dict:
    # 1. Fetch group, resources, and learning path
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    resources = db.query(Resource).filter(Resource.group_id == group_id).all()
    resource_info = [f"- ID {r.id}: {r.filename} (Uploaded: {r.created_at})" for r in resources]
    
    # 2. Fetch Learning Path
    learning_plan = group.learning_plan
    completed_topics = [f"- ID {lp.id}: {lp.title}" for lp in learning_plan if lp.status.value == "COMPLETED"]
    pending_topics = [f"- ID {lp.id}: {lp.title}" for lp in learning_plan if lp.status.value != "COMPLETED"]
    
    # 3. Fetch past sessions
    sessions = db.query(StudySession).filter(StudySession.group_id == group_id).order_by(StudySession.scheduled_at.asc()).all()
    
    pending_sessions = [s for s in sessions if s.status == SessionStatus.SCHEDULED]
    if pending_sessions:
        raise HTTPException(status_code=400, detail="A scheduled session already exists for this group. Complete or cancel it first.")
        
    completed_sessions = [s for s in sessions if s.status == SessionStatus.COMPLETED]
    
    # 4. Build Context String
    context_lines = []
    context_lines.append(f"Group Goal: {group.goal or 'Not specified'}")
    context_lines.append(f"Target Duration: {target_duration_minutes} minutes")
    
    context_lines.append("\nLearning Path - Completed Topics:")
    context_lines.extend(completed_topics if completed_topics else ["None"])
    
    context_lines.append("\nLearning Path - Pending Topics:")
    context_lines.extend(pending_topics if pending_topics else ["None"])
    
    context_lines.append("\nAvailable Resources:")
    context_lines.extend(resource_info if resource_info else ["None"])
    
    context_lines.append("\nSession History:")
    for idx, s in enumerate(completed_sessions):
        context_lines.append(f"\n{idx+1}. {s.title} (Type: {s.session_type.value}, Duration: {s.duration_minutes}m, Date: {s.scheduled_at})")
        if s.summary and s.summary.summary:
            context_lines.append(f"   Summary: {s.summary.summary}")
            
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
                json={"context": context_str, "target_duration": target_duration_minutes},
                headers=headers,
                timeout=120.0
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
