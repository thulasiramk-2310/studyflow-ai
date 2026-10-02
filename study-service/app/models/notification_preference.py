from sqlalchemy import Boolean, Column, Integer

from app.core.database import Base


class NotificationPreference(Base):
    """Per-user in-app notification settings. A missing row means everything is on."""

    __tablename__ = "notification_preferences"

    user_id = Column(Integer, primary_key=True)
    sessions = Column(Boolean, nullable=False, default=True)
    resources = Column(Boolean, nullable=False, default=True)
    ai_results = Column(Boolean, nullable=False, default=True)
    members = Column(Boolean, nullable=False, default=True)
