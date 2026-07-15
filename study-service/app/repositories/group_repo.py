from sqlalchemy.orm import Session
from app.models.group import StudyGroup, GroupMember, GroupRole, LearningPlanItem, LearningPlanItemStatus
from app.schemas.group import StudyGroupCreate, StudyGroupUpdate, LearningPlanItemCreate, LearningPlanItemUpdate, LearningPlanReorderRequestItem
from typing import List
from datetime import datetime, timezone
import secrets
import string

def generate_invite_code(length=6):
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def get_group_by_id(db: Session, group_id: int):
    return db.query(StudyGroup).filter(StudyGroup.id == group_id).first()

def get_group_by_invite_code(db: Session, invite_code: str):
    return db.query(StudyGroup).filter(StudyGroup.invite_code == invite_code).first()

from sqlalchemy.orm import joinedload

def get_user_groups(db: Session, user_id: int):
    return db.query(StudyGroup).join(GroupMember).filter(GroupMember.user_id == user_id).options(joinedload(StudyGroup.members)).all()

def create_group(db: Session, group_in: StudyGroupCreate, user_id: int):
    invite_code = generate_invite_code()
    
    # Ensure uniqueness of invite code
    while get_group_by_invite_code(db, invite_code):
        invite_code = generate_invite_code()
        
    db_group = StudyGroup(
        name=group_in.name,
        description=group_in.description,
        goal=group_in.goal,
        invite_code=invite_code,
        created_by=user_id
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add creator as ORGANIZER
    add_member(db, db_group.id, user_id, GroupRole.ORGANIZER)
    
    return db_group

def update_group(db: Session, db_group: StudyGroup, group_in: StudyGroupUpdate):
    db_group.name = group_in.name
    if group_in.description is not None:
        db_group.description = group_in.description
    if group_in.goal is not None:
        db_group.goal = group_in.goal
    db.commit()
    db.refresh(db_group)
    return db_group

def delete_group(db: Session, db_group: StudyGroup):
    db.delete(db_group)
    db.commit()

def add_member(db: Session, group_id: int, user_id: int, role: GroupRole = GroupRole.MEMBER):
    db_member = GroupMember(
        group_id=group_id,
        user_id=user_id,
        role=role
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

# Learning Plan Repository Functions

def get_learning_plan_item(db: Session, item_id: int):
    return db.query(LearningPlanItem).filter(LearningPlanItem.id == item_id).first()

def add_learning_plan_item(db: Session, group_id: int, item_in: LearningPlanItemCreate, user_id: int):
    # get max order index
    max_order = db.query(LearningPlanItem).filter(LearningPlanItem.group_id == group_id).order_by(LearningPlanItem.order_index.desc()).first()
    next_order = (max_order.order_index + 1) if max_order else 0
    
    db_item = LearningPlanItem(
        group_id=group_id,
        title=item_in.title,
        description=item_in.description,
        parent_id=item_in.parent_id,
        estimated_sessions=item_in.estimated_sessions,
        order_index=next_order,
        created_by=user_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_learning_plan_item(db: Session, db_item: LearningPlanItem, item_in: LearningPlanItemUpdate):
    if item_in.title is not None:
        db_item.title = item_in.title
    if item_in.description is not None:
        db_item.description = item_in.description
    if item_in.estimated_sessions is not None:
        db_item.estimated_sessions = item_in.estimated_sessions
    if item_in.status is not None:
        if db_item.status != item_in.status and item_in.status == LearningPlanItemStatus.COMPLETED:
            db_item.completed_at = datetime.now(timezone.utc)
        elif item_in.status != LearningPlanItemStatus.COMPLETED:
            db_item.completed_at = None
        db_item.status = item_in.status
        
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_learning_plan_item(db: Session, db_item: LearningPlanItem):
    db.delete(db_item)
    db.commit()

def reorder_learning_plan_items(db: Session, group_id: int, items_in: List[LearningPlanReorderRequestItem]):
    # To optimize, we can update in bulk, but for now we update one by one for simplicity
    for item in items_in:
        db_item = db.query(LearningPlanItem).filter(LearningPlanItem.id == item.id, LearningPlanItem.group_id == group_id).first()
        if db_item:
            db_item.order_index = item.order
    db.commit()

def get_member(db: Session, group_id: int, user_id: int):
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()

def get_group_members(db: Session, group_id: int):
    return db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
