from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.session import StudySession, SessionResource, SessionStatus
from app.models.group import StudyGroup, GroupMember, GroupRole
from app.models.resource import Resource
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.schemas.common import SuccessResponse
from app.core.events import publish_session_completed

router = APIRouter()

def check_group_membership(db: Session, group_id: int, user_id: int):
    member = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return member

@router.post("/", response_model=SuccessResponse[SessionResponse], status_code=status.HTTP_201_CREATED)
def create_session(session_in: SessionCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    member = check_group_membership(db, session_in.group_id, user_id)
    
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can create sessions")

    # Create the session
    new_session = StudySession(
        group_id=session_in.group_id,
        title=session_in.title,
        description=session_in.description,
        agenda=session_in.agenda,
        scheduled_at=session_in.scheduled_at,
        duration_minutes=session_in.duration_minutes,
        created_by=user_id,
        status=SessionStatus.SCHEDULED
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Attach resources
    for r_id in session_in.resource_ids:
        # Verify resource belongs to the group
        resource = db.query(Resource).filter(Resource.id == r_id, Resource.group_id == session_in.group_id).first()
        if resource:
            sess_res = SessionResource(session_id=new_session.id, resource_id=r_id)
            db.add(sess_res)
    db.commit()
    db.refresh(new_session)

    s_dict = new_session.__dict__.copy()
    s_dict["resources"] = [sr.resource for sr in new_session.resources]
    return {"success": True, "data": s_dict}

@router.get("/", response_model=SuccessResponse[List[SessionResponse]])
def get_user_sessions(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    # Get all sessions for groups the user is a member of
    group_ids = [m.group_id for m in db.query(GroupMember).filter(GroupMember.user_id == user_id).all()]
    sessions = db.query(StudySession).filter(StudySession.group_id.in_(group_ids)).order_by(StudySession.scheduled_at.asc()).all()
    
    result = []
    for s in sessions:
        s_dict = s.__dict__.copy()
        s_dict["resources"] = [sr.resource for sr in s.resources]
        result.append(s_dict)
    
    return {"success": True, "data": result}

@router.get("/{session_id}", response_model=SuccessResponse[SessionResponse])
def get_session(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    check_group_membership(db, session.group_id, user_id)
    
    s_dict = session.__dict__.copy()
    s_dict["resources"] = [sr.resource for sr in session.resources]
    return {"success": True, "data": s_dict}

@router.put("/{session_id}", response_model=SuccessResponse[SessionResponse])
def update_session(session_id: int, session_in: SessionUpdate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = check_group_membership(db, session.group_id, user_id)
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can update sessions")

    update_data = session_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session, key, value)
        
    db.commit()
    db.refresh(session)
    
    s_dict = session.__dict__.copy()
    s_dict["resources"] = [sr.resource for sr in session.resources]
    return {"success": True, "data": s_dict}

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = check_group_membership(db, session.group_id, user_id)
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can delete sessions")

    db.delete(session)
    db.commit()
    return None

@router.post("/{session_id}/complete", response_model=SuccessResponse[SessionResponse])
def complete_session(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = check_group_membership(db, session.group_id, user_id)
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can complete sessions")
        
    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Session is already completed")

    session.status = SessionStatus.COMPLETED
    db.commit()
    db.refresh(session)
    
    # Emit event for AI processing
    publish_session_completed(session.id, session.group_id)

    s_dict = session.__dict__.copy()
    s_dict["resources"] = [sr.resource for sr in session.resources]
    return {"success": True, "data": s_dict}
