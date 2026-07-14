from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class NotificationType(enum.Enum):
    SESSION_CREATED = "SESSION_CREATED"
    SESSION_UPDATED = "SESSION_UPDATED"
    SESSION_COMPLETED = "SESSION_COMPLETED"
    SUMMARY_READY = "SUMMARY_READY"
    QUIZ_READY = "QUIZ_READY"
    FLASHCARDS_READY = "FLASHCARDS_READY"
    MEMBER_JOINED = "MEMBER_JOINED"
    MEMBER_LEFT = "MEMBER_LEFT"
    MEETING_LINK_ADDED = "MEETING_LINK_ADDED"
    RESOURCE_UPLOADED = "RESOURCE_UPLOADED"
    RESOURCE_DELETED = "RESOURCE_DELETED"
    AI_SESSION_CREATED = "AI_SESSION_CREATED"
    AI_STUDY_PLAN_READY = "AI_STUDY_PLAN_READY"
    GROUP_CREATED = "GROUP_CREATED"
    GROUP_DELETED = "GROUP_DELETED"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True) # Receiver of notification
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    type = Column(Enum(NotificationType), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("StudyGroup")
