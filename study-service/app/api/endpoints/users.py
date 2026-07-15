from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.group import GroupMember, GroupRole, StudyGroup
from app.models.resource import Resource
from app.models.session import StudySession
from app.models.quiz import Quiz
from app.models.flashcard import FlashcardDeck
from app.schemas.user import DashboardResponse, DashboardStats, RecentActivityItem, UpcomingSessionItem, RecentResourceItem
from app.core.config import settings
from pydantic import BaseModel
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class UserProfileResponse(BaseModel):
    name: str
    email: str
    joinedAt: str
    groupsJoined: int
    resourcesShared: int
    sessionsHosted: int
    aiConversations: int
    aiQuestionsAsked: int

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("userId")
    name = current_user.get("name", "")
    email = current_user.get("email", "")
    
    # Try to parse createdAt from JWT, default to current year if missing (e.g. old token)
    created_at = current_user.get("createdAt", "2026-07-01T00:00:00")
    
    # Format to "Jul 2026"
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(created_at)
        joined_at_str = dt.strftime("%b %Y")
    except Exception:
        joined_at_str = "Jul 2026"

    groups_joined = db.query(GroupMember).filter(GroupMember.user_id == user_id).count()
    resources_shared = db.query(Resource).filter(Resource.uploaded_by == user_id).count()
    sessions_hosted = db.query(StudySession).filter(StudySession.created_by == user_id).count()
    
    total_ai_chats = 0
    total_questions_asked = 0
    try:
        with httpx.Client(timeout=3.0) as client:
            res = client.get(
                f"{settings.AI_SERVICE_URL}/api/v1/ai/chat/stats?user_id={user_id}",
                headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
            )
            if res.status_code == 200:
                data = res.json().get("data", {})
                total_ai_chats = data.get("total_ai_chats", 0)
                total_questions_asked = data.get("total_questions_asked", 0)
    except Exception as e:
        logger.error(f"Failed to fetch AI stats for profile: {e}")
        
    return UserProfileResponse(
        name=name,
        email=email,
        joinedAt=joined_at_str,
        groupsJoined=groups_joined,
        resourcesShared=resources_shared,
        sessionsHosted=sessions_hosted,
        aiConversations=total_ai_chats,
        aiQuestionsAsked=total_questions_asked
    )

def _time_ago(dt) -> str:
    from datetime import datetime, timezone
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = now - dt
    if diff.days > 1:
        return f"{diff.days} days ago"
    elif diff.days == 1:
        return "1 day ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600} hours ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60} mins ago"
    return "just now"

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("userId")
    
    # 1. Get user's groups
    user_groups = db.query(GroupMember).filter(GroupMember.user_id == user_id).all()
    group_ids = [g.group_id for g in user_groups]
    total_groups = len(group_ids)
    
    if total_groups == 0:
        # Return zeros
        return DashboardResponse(
            stats=DashboardStats(groups=0, resources=0, sessions=0, conversations=0, quizzes=0, flashcards=0),
            upcoming_sessions=[],
            recent_resources=[],
            recent_activity=[]
        )
        
    # 2. Group ID mapping for names
    groups = db.query(StudyGroup).filter(StudyGroup.id.in_(group_ids)).all()
    group_map = {g.id: g.name for g in groups}
    
    # 3. Stats
    total_resources = db.query(Resource).filter(Resource.group_id.in_(group_ids)).count()
    total_sessions = db.query(StudySession).filter(StudySession.group_id.in_(group_ids)).count()
    total_quizzes = db.query(Quiz).join(StudySession).filter(StudySession.group_id.in_(group_ids), Quiz.status == "READY").count()
    total_flashcards = db.query(FlashcardDeck).join(StudySession).filter(StudySession.group_id.in_(group_ids), FlashcardDeck.status == "READY").count()
    
    # AI Chats from ai-service
    total_ai_chats = 0
    try:
        with httpx.Client(timeout=3.0) as client:
            res = client.get(
                f"{settings.AI_SERVICE_URL}/api/v1/ai/chat/stats?user_id={user_id}",
                headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
            )
            if res.status_code == 200:
                total_ai_chats = res.json().get("data", {}).get("total_ai_chats", 0)
    except Exception as e:
        logger.warning(f"Failed to fetch AI chat stats: {e}")
        
    stats = DashboardStats(
        groups=total_groups,
        resources=total_resources,
        sessions=total_sessions,
        conversations=total_ai_chats,
        quizzes=total_quizzes,
        flashcards=total_flashcards
    )
    
    # 4. Upcoming Sessions
    upcoming_db = db.query(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        StudySession.status.in_(["SCHEDULED", "LIVE"])
    ).order_by(StudySession.scheduled_at.asc()).limit(5).all()
    
    upcoming_sessions = [
        UpcomingSessionItem(
            id=s.id,
            title=s.title,
            group_name=group_map.get(s.group_id, "Unknown"),
            scheduled_at=s.scheduled_at.isoformat()
        )
        for s in upcoming_db
    ]
    
    # 5. Recent Resources
    recent_res_db = db.query(Resource).filter(
        Resource.group_id.in_(group_ids)
    ).order_by(Resource.created_at.desc()).limit(5).all()
    
    recent_resources = [
        RecentResourceItem(
            id=r.id,
            title=r.original_filename,
            group_name=group_map.get(r.group_id, "Unknown"),
            time=_time_ago(r.created_at)
        )
        for r in recent_res_db
    ]
    
    # 6. Synthesize Recent Activity
    activity_pool = []
    
    # Add resources
    for r in recent_res_db:
        activity_pool.append({
            "dt": r.created_at,
            "type": "RESOURCE",
            "title": r.original_filename,
            "time": _time_ago(r.created_at)
        })
        
    # Add recent sessions
    recent_sessions_db = db.query(StudySession).filter(
        StudySession.group_id.in_(group_ids)
    ).order_by(StudySession.created_at.desc()).limit(5).all()
    
    for s in recent_sessions_db:
        activity_pool.append({
            "dt": s.created_at,
            "type": "SESSION",
            "title": s.title,
            "time": _time_ago(s.created_at)
        })
        
    # Add recent quizzes
    recent_quizzes_db = db.query(Quiz).join(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        Quiz.status == "READY",
        Quiz.generated_at.isnot(None)
    ).order_by(Quiz.generated_at.desc()).limit(3).all()
    
    for q in recent_quizzes_db:
        activity_pool.append({
            "dt": q.generated_at,
            "type": "QUIZ",
            "title": q.session.title if q.session else "Quiz generated",
            "time": _time_ago(q.generated_at)
        })
        
    # Add recent flashcards
    recent_flashcards_db = db.query(FlashcardDeck).join(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        FlashcardDeck.status == "READY",
        FlashcardDeck.generated_at.isnot(None)
    ).order_by(FlashcardDeck.generated_at.desc()).limit(3).all()
    
    for f in recent_flashcards_db:
        activity_pool.append({
            "dt": f.generated_at,
            "type": "FLASHCARDS",
            "title": f.session.title if f.session else "Flashcards generated",
            "time": _time_ago(f.generated_at)
        })
        
    # Sort activity pool by date desc
    activity_pool.sort(key=lambda x: x["dt"], reverse=True)
    recent_activity = [
        RecentActivityItem(type=a["type"], title=a["title"], time=a["time"])
        for a in activity_pool[:10]  # Take top 10
    ]
    
    return DashboardResponse(
        stats=stats,
        upcoming_sessions=upcoming_sessions,
        recent_resources=recent_resources,
        recent_activity=recent_activity
    )
