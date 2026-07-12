from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class ResourceStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    INDEXING = "INDEXING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(Integer, nullable=False) # User ID from Auth Service
    filename = Column(String, nullable=False, unique=True)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    storage_path = Column(String, nullable=False)
    status = Column(String, default=ResourceStatus.UPLOADED.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("StudyGroup", back_populates="resources")
    session_links = relationship("SessionResource", back_populates="resource", cascade="all, delete-orphan")
