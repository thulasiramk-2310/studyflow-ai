from sqlalchemy.orm import Session
from app.models.group import StudyGroup, GroupMember, GroupRole
from app.schemas.group import StudyGroupCreate, StudyGroupUpdate
import secrets
import string

def generate_invite_code(length=6):
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def get_group_by_id(db: Session, group_id: int):
    return db.query(StudyGroup).filter(StudyGroup.id == group_id).first()

def get_group_by_invite_code(db: Session, invite_code: str):
    return db.query(StudyGroup).filter(StudyGroup.invite_code == invite_code).first()

def get_user_groups(db: Session, user_id: int):
    return db.query(StudyGroup).join(GroupMember).filter(GroupMember.user_id == user_id).all()

def create_group(db: Session, group_in: StudyGroupCreate, user_id: int):
    invite_code = generate_invite_code()
    
    # Ensure uniqueness of invite code
    while get_group_by_invite_code(db, invite_code):
        invite_code = generate_invite_code()
        
    db_group = StudyGroup(
        name=group_in.name,
        description=group_in.description,
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

def get_member(db: Session, group_id: int, user_id: int):
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()

def get_group_members(db: Session, group_id: int):
    return db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
