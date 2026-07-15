from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.session import StudySession, SessionResource, SessionStatus
from app.models.group import StudyGroup, GroupMember, GroupRole
from app.models.resource import Resource
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse, SessionSummaryResponse, SessionAttendanceResponse
from app.schemas.quiz import QuizResponse, QuizSubmission, QuizResult, QuizQuestionResult
from app.schemas.common import SuccessResponse
from app.models.session import StudySession, SessionResource, SessionStatus, MeetingType, SessionAttendance, AttendanceStatus
from app.core.events import publish_session_completed
from app.services.summary_service import generate_session_summary_task
from app.services.quiz_service import generate_quiz_task
from app.services.flashcard_service import generate_flashcards_task
from app.schemas.flashcard import FlashcardDeckResponse, FlashcardGenerateRequest
from app.services import notification_service
from app.models.notification import NotificationType
from app.clients import auth_client
from app.repositories import group_repo

router = APIRouter()

def check_group_membership(db: Session, group_id: int, user_id: int):
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return member

@router.post("/", response_model=SuccessResponse[SessionResponse], status_code=status.HTTP_201_CREATED)
def create_session(session_in: SessionCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    member = check_group_membership(db, session_in.group_id, user_id)
    
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can create sessions")

    # Validate meeting URL if type is known
    if session_in.meeting_type == MeetingType.GOOGLE_MEET and session_in.meeting_url and not session_in.meeting_url.startswith("https://meet.google.com/"):
        raise HTTPException(status_code=400, detail="Invalid Google Meet URL")
    elif session_in.meeting_type == MeetingType.ZOOM and session_in.meeting_url and not session_in.meeting_url.startswith("https://zoom.us/"):
        raise HTTPException(status_code=400, detail="Invalid Zoom URL")

    # Create the session
    new_session = StudySession(
        group_id=session_in.group_id,
        title=session_in.title,
        description=session_in.description,
        agenda=session_in.agenda,
        scheduled_at=session_in.scheduled_at,
        duration_minutes=session_in.duration_minutes,
        meeting_type=session_in.meeting_type,
        meeting_url=session_in.meeting_url,
        created_by=user_id,
        status=SessionStatus.SCHEDULED,
        generated_by=session_in.generated_by
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

    # Notify members
    notification_service.notify_group_members(
        db=db,
        group_id=new_session.group_id,
        title="New Session Scheduled",
        message=f"A new session '{new_session.title}' has been scheduled.",
        type=NotificationType.SESSION_CREATED,
        exclude_user_id=user_id,
        entity_type="SESSION",
        entity_id=new_session.id
    )

    s_dict = {c.name: getattr(new_session, c.name) for c in new_session.__table__.columns}
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
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
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
    
    s_dict = {c.name: getattr(session, c.name) for c in session.__table__.columns}
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
    
    # Validate meeting URL on update if present
    m_type = update_data.get("meeting_type", session.meeting_type)
    m_url = update_data.get("meeting_url", session.meeting_url)
    if m_type == MeetingType.GOOGLE_MEET and m_url and not m_url.startswith("https://meet.google.com/"):
        raise HTTPException(status_code=400, detail="Invalid Google Meet URL")
    elif m_type == MeetingType.ZOOM and m_url and not m_url.startswith("https://zoom.us/"):
        raise HTTPException(status_code=400, detail="Invalid Zoom URL")

    for key, value in update_data.items():
        setattr(session, key, value)
        
    db.commit()
    db.refresh(session)
    
    # Notify members
    notification_service.notify_group_members(
        db=db,
        group_id=session.group_id,
        title="Session Updated",
        message=f"The session '{session.title}' has been updated.",
        type=NotificationType.SESSION_UPDATED,
        exclude_user_id=user_id,
        entity_type="SESSION",
        entity_id=session.id
    )
    
    s_dict = {c.name: getattr(session, c.name) for c in session.__table__.columns}
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

@router.post("/{session_id}/join", response_model=SuccessResponse[dict])
def join_session(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    check_group_membership(db, session.group_id, user_id)
    
    attendance = db.query(SessionAttendance).filter(
        SessionAttendance.session_id == session_id,
        SessionAttendance.user_id == user_id
    ).first()
    
    if not attendance:
        attendance = SessionAttendance(session_id=session_id, user_id=user_id, status=AttendanceStatus.PRESENT)
        db.add(attendance)
    else:
        attendance.status = AttendanceStatus.PRESENT
        
    db.commit()
    
    # Return meeting url if any
    return {"success": True, "data": {"meeting_url": session.meeting_url, "meeting_type": session.meeting_type}}

@router.get("/{session_id}/attendance", response_model=SuccessResponse[List[SessionAttendanceResponse]])
async def get_session_attendance(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    check_group_membership(db, session.group_id, user_id)
    
    attendance = db.query(SessionAttendance).filter(SessionAttendance.session_id == session_id).all()
    
    # Fetch user details from auth service
    user_ids = [a.user_id for a in attendance]
    user_map = {}
    if user_ids:
        users = await auth_client.get_users_batch(user_ids)
        user_map = {str(u["id"]): u for u in users}
        
    attendance_out = []
    for a in attendance:
        a_dict = {c.name: getattr(a, c.name) for c in a.__table__.columns}
        user_info = user_map.get(str(a.user_id), {})
        a_dict["name"] = user_info.get("name")
        a_dict["email"] = user_info.get("email")
        a_dict["avatar"] = user_info.get("avatar")
        attendance_out.append(a_dict)
        
    return {"success": True, "data": attendance_out}

@router.post("/{session_id}/complete", response_model=SuccessResponse[SessionResponse])
def complete_session(session_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
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
    
    # Generate ONLY summary in the background automatically
    resource_ids = [sr.resource_id for sr in session.resources]
    background_tasks.add_task(generate_session_summary_task, session.id, session.group_id, resource_ids)

    # Notify members
    notification_service.notify_group_members(
        db=db,
        group_id=session.group_id,
        title="Session Completed",
        message=f"Session '{session.title}' is complete. Summary generation has started.",
        type=NotificationType.SESSION_COMPLETED,
        exclude_user_id=user_id,
        entity_type="SESSION",
        entity_id=session.id
    )

    s_dict = {c.name: getattr(session, c.name) for c in session.__table__.columns}
    s_dict["resources"] = [sr.resource for sr in session.resources]
    return {"success": True, "data": s_dict}

@router.get("/{session_id}/summary", response_model=SuccessResponse[SessionSummaryResponse])
def get_session_summary(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    check_group_membership(db, session.group_id, user_id)
    
    if not session.summary:
        raise HTTPException(status_code=404, detail="Summary not found")
        
    return {"success": True, "data": session.summary}

@router.post("/{session_id}/summary/regenerate", response_model=SuccessResponse[dict])
def regenerate_session_summary(session_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = check_group_membership(db, session.group_id, user_id)
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can regenerate summaries")
        
    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only regenerate summaries for completed sessions")
        
    resource_ids = [sr.resource_id for sr in session.resources]
    background_tasks.add_task(generate_session_summary_task, session.id, session.group_id, resource_ids)
    
    return {"success": True, "data": {"message": "Regeneration started"}}

@router.get("/{session_id}/quiz", response_model=SuccessResponse[QuizResponse])
def get_session_quiz(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    check_group_membership(db, session.group_id, user_id)
    
    if not session.quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    return {"success": True, "data": session.quiz}

@router.post("/{session_id}/quiz/grade", response_model=SuccessResponse[QuizResult])
def grade_session_quiz(session_id: int, submission: QuizSubmission, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = group_repo.get_member(db=db, group_id=session.group_id, user_id=user.get("userId"))
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    if not session.quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = session.quiz.questions
    if len(submission.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Number of answers does not match number of questions")

    correct_count = 0
    results = []
    
    for idx, question in enumerate(questions):
        submitted_answer = submission.answers[idx]
        is_correct = submitted_answer == question.correct_answer
        if is_correct:
            correct_count += 1
            
        results.append(
            QuizQuestionResult(
                id=question.id,
                correct_answer=question.correct_answer,
                explanation=question.explanation,
                is_correct=is_correct
            )
        )
        
    total = len(questions)
    percentage = (correct_count / total * 100) if total > 0 else 0
    passed = percentage >= 70.0

    result = QuizResult(
        score=correct_count,
        total=total,
        percentage=percentage,
        passed=passed,
        results=results
    )
    
    return {"success": True, "data": result}

@router.post("/{session_id}/quiz/regenerate", response_model=SuccessResponse[dict])
def regenerate_session_quiz(session_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = check_group_membership(db, session.group_id, user_id)
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can regenerate quizzes")
        
    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only regenerate quizzes for completed sessions")
        
    resource_ids = [sr.resource_id for sr in session.resources]
    background_tasks.add_task(generate_quiz_task, session.id, session.group_id, resource_ids)
    
    return {"success": True, "data": {"message": "Quiz regeneration started"}}

@router.get("/{session_id}/flashcards", response_model=SuccessResponse[FlashcardDeckResponse])
def get_session_flashcards(session_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    check_group_membership(db, session.group_id, user_id)
    
    if not session.flashcard_deck:
        raise HTTPException(status_code=404, detail="Flashcards not found")
        
    return {"success": True, "data": session.flashcard_deck}

@router.post("/{session_id}/flashcards/generate", response_model=SuccessResponse[dict])
def generate_session_flashcards(session_id: int, req: FlashcardGenerateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = user.get("userId")
    session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    member = check_group_membership(db, session.group_id, user_id)
    if member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can generate flashcards")
        
    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only generate flashcards for completed sessions")
        
    resource_ids = [sr.resource_id for sr in session.resources]
    background_tasks.add_task(generate_flashcards_task, session.id, session.group_id, resource_ids, req.count)
    
    return {"success": True, "data": {"message": "Flashcard generation started"}}

@router.post("/{session_id}/flashcards/regenerate", response_model=SuccessResponse[dict])
def regenerate_session_flashcards(session_id: int, req: FlashcardGenerateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    # Reuses the exact same logic as generate
    return generate_session_flashcards(session_id, req, background_tasks, db, user)
