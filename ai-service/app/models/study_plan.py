from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, UniqueConstraint

from app.core.database import Base


class StudyPlan(Base):
    """Latest study plan created through the MCP tools, one per (group, user)."""

    __tablename__ = "study_plans"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_study_plans_group_user"),)

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    plan = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
