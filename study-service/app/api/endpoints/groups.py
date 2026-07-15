from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.group import (
    StudyGroupCreate, 
    StudyGroupUpdate, 
    StudyGroupResponse,
    StudyGroupDetailResponse,
    GroupMemberResponse,
    JoinGroupRequest,
    LearningPlanItemCreate,
    LearningPlanItemUpdate,
    LearningPlanItemResponse,
    LearningPlanReorderRequestItem
)
from app.schemas.common import SuccessResponse
from app.schemas.session import SessionResponse
from app.repositories import group_repo
from app.models.group import GroupRole
from app.clients import auth_client
from app.services import notification_service
from app.models.notification import NotificationType

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
    groups = group_repo.get_user_groups(db=db, user_id=user_id)
    result = []
    for group in groups:
        g_dict = {c.name: getattr(group, c.name) for c in group.__table__.columns}
        g_dict["members"] = group.members
        
        learning_plan = getattr(group, "learning_plan", [])
        total_items_count = len(learning_plan) if learning_plan else 0
        completed_items_count = sum(1 for item in learning_plan if getattr(item, "status", None) == "COMPLETED") if learning_plan else 0
        progress_percent = int((completed_items_count / total_items_count) * 100) if total_items_count > 0 else 0
        
        next_item = None
        if learning_plan:
            pending = [item for item in learning_plan if getattr(item, "status", None) != "COMPLETED"]
            pending.sort(key=lambda x: getattr(x, "order_index", 0))
            if pending:
                ni = pending[0]
                if hasattr(ni, "__table__"):
                    next_item = {c.name: getattr(ni, c.name) for c in ni.__table__.columns}
                elif hasattr(ni, "dict"):
                    next_item = ni.dict()
                else:
                    next_item = ni
                    
        g_dict["total_items_count"] = total_items_count
        g_dict["completed_items_count"] = completed_items_count
        g_dict["progress_percent"] = progress_percent
        g_dict["next_item"] = next_item
        
        result.append(g_dict)
        
    return {"success": True, "data": result}

@router.get("/{group_id}", response_model=SuccessResponse[StudyGroupDetailResponse])
async def get_group(
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
        
    # Hydrate group members with user profiles from Auth Service
    db_members = group_repo.get_group_members(db=db, group_id=group_id)
    user_ids = [m.user_id for m in db_members]
    
    users = await auth_client.get_users_batch(user_ids)
    user_map = {u["id"]: u for u in users}
    
    # We construct the detail response manually to include members
    group_dict = {c.name: getattr(group, c.name) for c in group.__table__.columns}
    
    members_out = []
    for m in db_members:
        m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
        user_info = user_map.get(str(m.user_id), {})
        m_dict["name"] = user_info.get("name")
        m_dict["email"] = user_info.get("email")
        m_dict["avatar"] = user_info.get("avatar")
        members_out.append(m_dict)
        
    group_dict["members"] = members_out
    
    learning_plan = getattr(group, "learning_plan", [])
    total_items_count = len(learning_plan) if learning_plan else 0
    completed_items_count = sum(1 for item in learning_plan if getattr(item, "status", None) == "COMPLETED") if learning_plan else 0
    progress_percent = int((completed_items_count / total_items_count) * 100) if total_items_count > 0 else 0
    
    next_item = None
    if learning_plan:
        pending = [item for item in learning_plan if getattr(item, "status", None) != "COMPLETED"]
        pending.sort(key=lambda x: getattr(x, "order_index", 0))
        if pending:
            ni = pending[0]
            if hasattr(ni, "__table__"):
                next_item = {c.name: getattr(ni, c.name) for c in ni.__table__.columns}
            elif hasattr(ni, "dict"):
                next_item = ni.dict()
            else:
                next_item = ni
                
    group_dict["total_items_count"] = total_items_count
    group_dict["completed_items_count"] = completed_items_count
    group_dict["progress_percent"] = progress_percent
    group_dict["next_item"] = next_item

    # Add learning_plan to response dictionary
    lp_out = []
    if learning_plan:
        for item in learning_plan:
            if hasattr(item, "__table__"):
                item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
            elif hasattr(item, "dict"):
                item_dict = item.dict()
            else:
                item_dict = dict(item)
            lp_out.append(item_dict)
    group_dict["learning_plan"] = lp_out
    
    return {"success": True, "data": group_dict}


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
    
    # Notify group members
    notification_service.notify_group_members(
        db=db,
        group_id=group.id,
        title="New Member Joined",
        message=f"{current_user.get('name', 'A user')} joined the group.",
        type=NotificationType.MEMBER_JOINED,
        exclude_user_id=current_user.get("userId"),
        entity_type="GROUP",
        entity_id=group.id
    )
    
    return {"success": True, "data": group}

@router.get("/{group_id}/sessions", response_model=SuccessResponse[List[SessionResponse]])
def get_group_sessions(
    group_id: int,
    upcoming: Optional[bool] = False,
    limit: Optional[int] = None,
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
        
    from app.models.session import StudySession, SessionStatus
    query = db.query(StudySession).filter(StudySession.group_id == group_id)
    if upcoming:
        query = query.filter(StudySession.status.in_([SessionStatus.SCHEDULED, SessionStatus.LIVE]))
    query = query.order_by(StudySession.scheduled_at.asc())
    if limit is not None:
        query = query.limit(limit)
    sessions = query.all()
    
    result = []
    for s in sessions:
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        s_dict["resources"] = [sr.resource for sr in s.resources]
        result.append(s_dict)
    return {"success": True, "data": result}

@router.get("/{group_id}/members", response_model=SuccessResponse[List[GroupMemberResponse]])
async def get_group_members(
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
        
    db_members = group_repo.get_group_members(db=db, group_id=group_id)
    user_ids = [m.user_id for m in db_members]
    users = await auth_client.get_users_batch(user_ids)
    user_map = {u["id"]: u for u in users}
    
    members_out = []
    for m in db_members:
        m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
        user_info = user_map.get(str(m.user_id), {})
        m_dict["name"] = user_info.get("name")
        m_dict["email"] = user_info.get("email")
        m_dict["avatar"] = user_info.get("avatar")
        members_out.append(m_dict)
    return {"success": True, "data": members_out}

@router.post("/{group_id}/leave", response_model=SuccessResponse[dict])
def leave_group(
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
        raise HTTPException(status_code=400, detail="Not a member of this group")
        
    if member.role == GroupRole.ORGANIZER:
        organizers = [m for m in group.members if m.role == GroupRole.ORGANIZER]
        if len(organizers) <= 1:
            raise HTTPException(
                status_code=409, 
                detail="Transfer ownership or delete the group before leaving."
            )
            
    db.delete(member)
    db.commit()
    
    # Notify group members
    notification_service.notify_group_members(
        db=db,
        group_id=group_id,
        title="Member Left",
        message=f"{current_user.get('name', 'A user')} left the group.",
        type=NotificationType.MEMBER_LEFT,
        exclude_user_id=current_user.get("userId"),
        entity_type="GROUP",
        entity_id=group_id
    )
    
    return {"success": True, "data": {"message": "Left group successfully"}}

@router.delete("/{group_id}/members/{target_user_id}", response_model=SuccessResponse[dict])
def remove_member(
    group_id: int,
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    group = group_repo.get_group_by_id(db=db, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    requester = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not requester or requester.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can remove members")
        
    target_member = group_repo.get_member(db=db, group_id=group_id, user_id=target_user_id)
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if target_member.role == GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Cannot remove another organizer")
        
    db.delete(target_member)
    db.commit()
    return {"success": True, "data": {"message": "Member removed successfully"}}

@router.post("/{group_id}/invite-code", response_model=SuccessResponse[dict])
def regenerate_invite_code(
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
        raise HTTPException(status_code=403, detail="Only organizers can regenerate invite codes")
        
    new_code = group_repo.generate_invite_code()
    while group_repo.get_group_by_invite_code(db, new_code):
        new_code = group_repo.generate_invite_code()
        
    group.invite_code = new_code
    db.commit()
    db.refresh(group)
    
    return {"success": True, "data": {"invite_code": new_code}}

@router.post("/{group_id}/promote")
def promote_member(group_id: int):
    raise HTTPException(status_code=501, detail="Not Implemented")

@router.post("/{group_id}/transfer")
def transfer_ownership(group_id: int):
    raise HTTPException(status_code=501, detail="Not Implemented")

@router.post("/{group_id}/schedule-agent")
async def schedule_agent(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    
    # 1. Verify Organizer Role
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can use the AI Study Planner")
        
    # 2. Call agent service
    from app.services.agent_service import generate_agentic_schedule
    proposal = await generate_agentic_schedule(db=db, group_id=group_id)
    
    return {"success": True, "data": proposal}

# --- Learning Plan Endpoints ---

@router.post("/{group_id}/roadmap", response_model=SuccessResponse[LearningPlanItemResponse], status_code=status.HTTP_201_CREATED)
def add_learning_plan_item(
    group_id: int,
    item_in: LearningPlanItemCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can add learning plan items")
        
    item = group_repo.add_learning_plan_item(db=db, group_id=group_id, item_in=item_in, user_id=user_id)
    return {"success": True, "data": item}

@router.put("/{group_id}/roadmap/reorder", response_model=SuccessResponse[Any])
def reorder_learning_plan_items(
    group_id: int,
    items_in: List[LearningPlanReorderRequestItem],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can reorder learning plan items")
        
    group_repo.reorder_learning_plan_items(db=db, group_id=group_id, items_in=items_in)
    return {"success": True, "data": {"message": "Items reordered successfully"}}

@router.put("/{group_id}/roadmap/{item_id}", response_model=SuccessResponse[LearningPlanItemResponse])
def update_learning_plan_item(
    group_id: int,
    item_id: int,
    item_in: LearningPlanItemUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can update learning plan items")
        
    db_item = group_repo.get_learning_plan_item(db=db, item_id=item_id)
    if not db_item or db_item.group_id != group_id:
        raise HTTPException(status_code=404, detail="Item not found")
        
    updated_item = group_repo.update_learning_plan_item(db=db, db_item=db_item, item_in=item_in)
    return {"success": True, "data": updated_item}

@router.delete("/{group_id}/roadmap/{item_id}", response_model=SuccessResponse[Any])
def delete_learning_plan_item(
    group_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    member = group_repo.get_member(db=db, group_id=group_id, user_id=user_id)
    if not member or member.role != GroupRole.ORGANIZER:
        raise HTTPException(status_code=403, detail="Only organizers can delete learning plan items")
        
    db_item = group_repo.get_learning_plan_item(db=db, item_id=item_id)
    if not db_item or db_item.group_id != group_id:
        raise HTTPException(status_code=404, detail="Item not found")
        
    group_repo.delete_learning_plan_item(db=db, db_item=db_item)
    return {"success": True, "data": {"message": "Item deleted successfully"}}
