from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class SessionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class MeetingType(str, enum.Enum):
    NONE = "NONE"
    GOOGLE_MEET = "GOOGLE_MEET"
    ZOOM = "ZOOM"
    MICROSOFT_TEAMS = "MICROSOFT_TEAMS"
    DISCORD = "DISCORD"
    OTHER = "OTHER"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"

class SummaryStatus(str, enum.Enum):
    PENDING = "PENDING"
    GENERATING = "GENERATING"
    READY = "READY"
    FAILED = "FAILED"

class SessionResource(Base):
    __tablename__ = "session_resources"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    session = relationship("StudySession", back_populates="resources")
    resource = relationship("Resource", back_populates="session_links")


class SessionAttendance(Base):
    __tablename__ = "session_attendance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, nullable=False) # User ID from Auth Service
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)

    session = relationship("StudySession", back_populates="attendance")


class SessionSummary(Base):
    __tablename__ = "session_summaries"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    summary = Column(Text, nullable=True) # Executive summary
    key_concepts = Column(JSON, nullable=True)
    important_points = Column(JSON, nullable=True)
    action_items = Column(JSON, nullable=True)
    
    status = Column(Enum(SummaryStatus), default=SummaryStatus.PENDING, nullable=False)
    model = Column(String(50), nullable=True)
    generated_at = Column(DateTime, nullable=True)
    generation_time_ms = Column(Integer, nullable=True)

    session = relationship("StudySession", back_populates="summary")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    agenda = Column(Text, nullable=True) # E.g. bullet points
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.SCHEDULED, nullable=False)
    
    meeting_type = Column(Enum(MeetingType), default=MeetingType.NONE, nullable=False)
    meeting_url = Column(String(512), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    generated_by = Column(String(20), default="MANUAL", nullable=False)
    created_by = Column(Integer, nullable=False) # User ID from Auth Service
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    group = relationship("StudyGroup", back_populates="sessions")
    resources = relationship("SessionResource", back_populates="session", cascade="all, delete-orphan")
    attendance = relationship("SessionAttendance", back_populates="session", cascade="all, delete-orphan")
    summary = relationship("SessionSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")
    quiz = relationship("Quiz", back_populates="session", uselist=False, cascade="all, delete-orphan")
    flashcard_deck = relationship("FlashcardDeck", back_populates="session", uselist=False, cascade="all, delete-orphan")
