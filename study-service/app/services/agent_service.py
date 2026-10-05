import json
import logging
import httpx
from sqlalchemy.orm import Session, joinedload
from app.models.session import StudySession, SessionStatus, SummaryStatus
from app.models.group import StudyGroup, LearningPlanItem, LearningPlanItemStatus
from app.models.resource import Resource
from app.core.config import settings
from fastapi import HTTPException

logger = logging.getLogger(__name__)

HISTORY_LIMIT = 10
CONTEXT_LIMIT = 24000


def _followups(summary) -> dict:
    """Retain source attribution without treating an action as still outstanding."""
    actions = []
    for item in (summary.action_items or [])[:10]:
        if isinstance(item, dict):
            # Minutes store "" for an owner or due date nobody stated: report it as unknown.
            actions.append({key: str(item[key])[:300] if item.get(key) else None
                            for key in ("task", "owner", "due")})
        elif isinstance(item, str):
            actions.append({"task": item[:300], "owner": None, "due": None})
    return {
        "source": summary.source,
        "actions_to_review": actions,
        "open_questions": [str(q)[:300] for q in (summary.open_questions or [])[:10]],
    }

async def generate_agentic_schedule(db: Session, group_id: int, target_duration_minutes: int) -> dict:
    # 1. Fetch group, resources, and learning path
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    resources = (db.query(Resource).filter(Resource.group_id == group_id)
                 .order_by(Resource.created_at.desc(), Resource.id.desc()).limit(50).all())
    resource_info = [f"- ID {r.id}: {r.filename[:100]} (Uploaded: {r.created_at})" for r in resources]
    
    # 2. Fetch Learning Path
    learning_plan = (db.query(LearningPlanItem).filter(LearningPlanItem.group_id == group_id)
                     .order_by((LearningPlanItem.status == LearningPlanItemStatus.COMPLETED).asc(),
                               LearningPlanItem.order_index, LearningPlanItem.id).limit(50).all())
    completed_topics = [f"- ID {lp.id}: {lp.title[:120]}" for lp in learning_plan if lp.status.value == "COMPLETED"]
    pending_topics = [f"- ID {lp.id}: {lp.title[:120]}" for lp in learning_plan if lp.status.value != "COMPLETED"]
    
    # 3. Fetch past sessions
    pending_session = db.query(StudySession.id).filter(
        StudySession.group_id == group_id,
        StudySession.status.in_([SessionStatus.SCHEDULED, SessionStatus.LIVE]),
    ).first()
    if pending_session:
        raise HTTPException(status_code=400, detail="A scheduled or live session already exists for this group. Complete or cancel it first.")

    completed_sessions = (db.query(StudySession).filter(
        StudySession.group_id == group_id, StudySession.status == SessionStatus.COMPLETED,
    ).options(joinedload(StudySession.summary), joinedload(StudySession.quiz), joinedload(StudySession.flashcard_deck))
      .order_by(StudySession.scheduled_at.desc(), StudySession.id.desc()).limit(HISTORY_LIMIT).all())
    
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
    
    context_lines.append("\nRecent Session History (newest first; older history may be omitted):")
    for idx, s in enumerate(completed_sessions):
        entry = [f"\n{idx+1}. {s.title} (ID: {s.id}, Type: {s.session_type.value}, Duration: {s.duration_minutes}m, Date: {s.scheduled_at})"]
        summary = s.summary
        if summary and summary.status == SummaryStatus.READY:
            is_minutes = bool(summary.source or summary.review_status)
            if not is_minutes or summary.review_status == "APPROVED":
                entry.append(f"   Summary: {(summary.summary or '')[:1200]}")
                if is_minutes:
                    entry.append("   Approved minutes follow-ups: " + json.dumps(_followups(summary), ensure_ascii=True))
            
        if s.quiz:
            entry.append(f"   Quiz Status: {s.quiz.status.value}")
        if s.flashcard_deck:
            entry.append(f"   Flashcards Status: {s.flashcard_deck.status.value}")
        # Keep whole entries so a clipped JSON fragment cannot change its meaning.
        if len("\n".join(context_lines + entry)) > CONTEXT_LIMIT:
            context_lines.append("Additional session history omitted for size.")
            break
        context_lines.extend(entry)

    context_str = "\n".join(context_lines)
    
    # 5. Call AI Service
    ai_url = f"{settings.AI_SERVICE_URL}/api/v1/ai/schedule"
    headers = {"X-Internal-Key": settings.INTERNAL_API_KEY}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                ai_url,
                json={"context": context_str, "target_duration": target_duration_minutes, "audience": group.audience or "student"},
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
