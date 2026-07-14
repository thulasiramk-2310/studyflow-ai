from sqlalchemy.orm import Session
from sqlalchemy import or_, case
from app.models.group import StudyGroup, GroupMember
from app.models.resource import Resource
from app.models.session import StudySession
from app.models.quiz import Quiz
from app.models.flashcard import FlashcardDeck
# We do not have chat sessions in study_db (they are in ai_db), so we will proxy or skip them.
# The user spec says ILIKE on chat title, but chat sessions are in ai_db. 
# We'll skip chat sessions in study-service search for now, or assume it's omitted unless we call ai-service.
# For v1, let's just return empty array for chatSessions or do a simple integration.
# Actually, the user spec says: "Search Strategy SQL ILIKE on Chat Title".
# But AI Chat is handled by AI Service. We can just skip it here or leave it empty, since study_db doesn't have it.
import logging

logger = logging.getLogger(__name__)

def search_content(db: Session, user_id: int, query: str, limit: int = 5):
    q = f"%{query}%"
    exact = f"{query}"
    starts = f"{query}%"
    
    # 1. Get user's groups
    user_groups = db.query(GroupMember.group_id).filter(GroupMember.user_id == user_id).all()
    group_ids = [g[0] for g in user_groups]
    
    if not group_ids:
        return {
            "groups": [],
            "resources": [],
            "sessions": [],
            "quizzes": [],
            "flashcards": [],
            "chatSessions": []
        }
        
    group_order = case(
        (StudyGroup.name.ilike(exact), 1),
        (StudyGroup.name.ilike(starts), 2),
        (StudyGroup.name.ilike(q), 3),
        else_=4
    )
    # Search Groups (where user is member)
    groups = db.query(StudyGroup).filter(
        StudyGroup.id.in_(group_ids),
        or_(
            StudyGroup.name.ilike(q),
            StudyGroup.description.ilike(q)
        )
    ).order_by(group_order, StudyGroup.created_at.desc()).limit(limit).all()
    
    res_order = case(
        (Resource.original_filename.ilike(exact), 1),
        (Resource.original_filename.ilike(starts), 2),
        (Resource.original_filename.ilike(q), 3),
        else_=4
    )
    # Search Resources
    resources = db.query(Resource).filter(
        Resource.group_id.in_(group_ids),
        Resource.original_filename.ilike(q)
    ).order_by(res_order, Resource.created_at.desc()).limit(limit).all()
    
    sess_order = case(
        (StudySession.title.ilike(exact), 1),
        (StudySession.title.ilike(starts), 2),
        (StudySession.title.ilike(q), 3),
        else_=4
    )
    # Search Sessions
    sessions = db.query(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        or_(
            StudySession.title.ilike(q),
            StudySession.description.ilike(q)
        )
    ).order_by(sess_order, StudySession.created_at.desc()).limit(limit).all()
    
    # Search Quizzes (join session to get group)
    quizzes = db.query(Quiz).join(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        StudySession.title.ilike(q)
    ).order_by(sess_order, Quiz.created_at.desc()).limit(limit).all()
    
    # Search Flashcards
    flashcards = db.query(FlashcardDeck).join(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        StudySession.title.ilike(q)
    ).order_by(sess_order, FlashcardDeck.created_at.desc()).limit(limit).all()
    
    # Format results
    return {
        "groups": [
            {"id": g.id, "title": g.name, "description": g.description, "type": "group", "url": f"/groups/{g.id}", "group_id": g.id}
            for g in groups
        ],
        "resources": [
            {"id": r.id, "title": r.original_filename, "type": "resource", "url": f"/groups/{r.group_id}?tab=resources", "group_id": r.group_id}
            for r in resources
        ],
        "sessions": [
            {"id": s.id, "title": s.title, "description": s.description, "type": "session", "url": f"/sessions/{s.id}", "group_id": s.group_id}
            for s in sessions
        ],
        "quizzes": [
            {"id": qz.id, "title": f"Quiz: {qz.session.title}", "type": "quiz", "url": f"/sessions/{qz.session_id}?tab=quiz", "group_id": qz.session.group_id}
            for qz in quizzes
        ],
        "flashcards": [
            {"id": f.id, "title": f"Flashcards: {f.session.title}", "type": "flashcard", "url": f"/sessions/{f.session_id}?tab=flashcards", "group_id": f.session.group_id}
            for f in flashcards
        ],
        "chatSessions": []
    }
