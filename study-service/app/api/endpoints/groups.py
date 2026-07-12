from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.group import (
    StudyGroupCreate, 
    StudyGroupUpdate, 
    StudyGroupResponse,
    StudyGroupDetailResponse,
    GroupMemberResponse,
    JoinGroupRequest
)
from app.schemas.common import SuccessResponse
from app.repositories import group_repo
from app.models.group import GroupRole

router = APIRouter()

@router.post("/", response_model=SuccessResponse[StudyGroupResponse], status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: StudyGroupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    return {"success": True, "data": group_repo.create_group(db=db, group_in=group_in, user_id=user_id)}

@router.get("/", response_model=SuccessResponse[List[StudyGroupResponse]])
def get_user_groups(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    return {"success": True, "data": group_repo.get_user_groups(db=db, user_id=user_id)}

@router.get("/{group_id}", response_model=SuccessResponse[StudyGroupDetailResponse])
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    group = group_repo.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return {"success": True, "data": group}

@router.put("/{group_id}", response_model=SuccessResponse[StudyGroupResponse])
def update_group(
    group_id: int,
    group_in: StudyGroupUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    group = group_repo.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Not authorized to update this group")
        
    return {"success": True, "data": group_repo.update_group(db=db, db_group=group, group_in=group_in)}

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    group = group_repo.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Not authorized to delete this group")
        
    group_repo.delete_group(db=db, db_group=group)
    return None

@router.post("/join", response_model=SuccessResponse[StudyGroupResponse])
def join_group(
    join_request: JoinGroupRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    group = group_repo.get_group_by_invite_code(db=db, invite_code=join_request.inviteCode)
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")
        
    member = group_repo.get_member(db=db, group_id=group.id, user_id=user_id)
    if member:
        raise HTTPException(status_code=400, detail="Already a member of this group")
        
    group_repo.add_member(db=db, group_id=group.id, user_id=user_id)
    return {"success": True, "data": group}

@router.get("/{group_id}/sessions", response_model=SuccessResponse[List[Any]])
def get_group_sessions(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    
    group = group_repo.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    from app.models.session import StudySession
    sessions = db.query(StudySession).filter(StudySession.group_id == group_id).order_by(StudySession.scheduled_at.asc()).all()
    
    result = []
    for s in sessions:
        s_dict = s.__dict__.copy()
        s_dict["resources"] = [sr.resource for sr in s.resources]
        result.append(s_dict)
    return {"success": True, "data": result}

@router.get("/{group_id}/members", response_model=SuccessResponse[List[GroupMemberResponse]])
def get_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    group = group_repo.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    return {"success": True, "data": group_repo.get_group_members(db=db, group_id=group_id)}
