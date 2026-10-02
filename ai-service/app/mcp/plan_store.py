"""Store for plans created through the MCP tools, backed by the ai_db `study_plans` table.

Plans used to live in a process-local dict, so they vanished on restart and
replicas disagreed. The table keeps one latest plan per (group, user); every
replica reads and writes the same row.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.study_plan import StudyPlan

logger = logging.getLogger(__name__)

_session_factory: Optional[Callable[[], Session]] = None


def use_session_factory(factory: Optional[Callable[[], Session]]) -> None:
    """Point the store at a different database (tests). None restores the default."""
    global _session_factory
    _session_factory = factory


def _session() -> Session:
    if _session_factory is not None:
        return _session_factory()
    from app.core.database import SessionLocal

    return SessionLocal()


def save_plan(group_id: int, user_id: int, plan: dict[str, Any]) -> dict[str, Any]:
    for attempt in range(2):
        with _session() as db:
            row = db.query(StudyPlan).filter_by(group_id=group_id, user_id=user_id).first()
            if row:
                row.plan = plan
            else:
                db.add(StudyPlan(group_id=group_id, user_id=user_id, plan=plan))
            try:
                db.commit()
                break
            except IntegrityError:
                # Another replica inserted the same (group, user) first; update its row instead.
                db.rollback()
                if attempt == 1:
                    raise
    logger.info(f"Stored study plan | group={group_id} user={user_id}")
    return plan


def get_plan(group_id: int, user_id: int) -> Optional[dict[str, Any]]:
    with _session() as db:
        row = db.query(StudyPlan).filter_by(group_id=group_id, user_id=user_id).first()
        return row.plan if row else None


def delete_user(user_id: int) -> int:
    """Remove every plan a user created (account deletion). Returns how many were removed."""
    with _session() as db:
        removed = db.query(StudyPlan).filter_by(user_id=user_id).delete()
        db.commit()
        return removed


def clear() -> None:
    """Delete every stored plan (tests)."""
    with _session() as db:
        db.query(StudyPlan).delete()
        db.commit()
