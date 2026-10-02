"""The audience a group's shared AI content is written for."""

from sqlalchemy.orm import Session

from app.models.group import StudyGroup


def group_audience(db: Session, group_id: int) -> str:
    audience = db.query(StudyGroup.audience).filter(StudyGroup.id == group_id).scalar()
    return audience if audience in ("student", "professional") else "student"
