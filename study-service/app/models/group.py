from sqlalchemy import Column, String, Integer, Enum, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class GroupRole(str, enum.Enum):
    ORGANIZER = "ORGANIZER"
    MEMBER = "MEMBER"

class LearningPlanItemStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    goal = Column(String(500), nullable=True)
    invite_code = Column(String(10), unique=True, index=True, nullable=False)
    
    # We store the created_by as an integer representing the user_id from the auth service's users table.
    # No foreign key constraint because the auth-service owns the users table.
    created_by = Column(Integer, nullable=False) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="group", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="group", cascade="all, delete-orphan")
    learning_plan = relationship("LearningPlanItem", back_populates="group", cascade="all, delete-orphan", order_by="LearningPlanItem.order_index")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, nullable=False)
    role = Column(Enum(GroupRole), default=GroupRole.MEMBER, nullable=False)
    
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("StudyGroup", back_populates="members")

class LearningPlanItem(Base):
    __tablename__ = "learning_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    parent_id = Column(Integer, ForeignKey("learning_plan_items.id", ondelete="SET NULL"), nullable=True)
    order_index = Column(Integer, default=0)
    status = Column(Enum(LearningPlanItemStatus), default=LearningPlanItemStatus.NOT_STARTED, nullable=False)
    estimated_sessions = Column(Integer, nullable=True)
    is_ai_generated = Column(Boolean, default=False)
    
    created_by = Column(Integer, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    group = relationship("StudyGroup", back_populates="learning_plan")
