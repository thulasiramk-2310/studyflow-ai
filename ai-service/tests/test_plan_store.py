"""MCP study plans live in ai_db, so they survive restarts and every replica sees them."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.mcp import plan_store


def _factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def test_a_saved_plan_is_readable_through_a_new_session():
    factory = _factory()
    plan_store.use_session_factory(factory)

    plan_store.save_plan(1, 7, {"title": "Deadlocks", "duration_minutes": 60})

    # Nothing is cached in the process: a fresh session reads it from the table.
    with factory() as db:
        from app.models.study_plan import StudyPlan
        assert db.query(StudyPlan).count() == 1
    assert plan_store.get_plan(1, 7) == {"title": "Deadlocks", "duration_minutes": 60}


def test_saving_again_replaces_the_plan_for_that_group_and_user():
    plan_store.use_session_factory(_factory())

    plan_store.save_plan(1, 7, {"title": "First"})
    plan_store.save_plan(1, 7, {"title": "Second"})
    plan_store.save_plan(1, 8, {"title": "Someone else"})

    assert plan_store.get_plan(1, 7) == {"title": "Second"}
    assert plan_store.get_plan(1, 8) == {"title": "Someone else"}
    assert plan_store.get_plan(2, 7) is None
