"""Atomicity of the two multi-write creation paths.

Both previously committed twice, so a failure on the second write left a
half-built row behind: a group with no organizer, or a session with none of the
resources it was created with.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from app.api.endpoints import sessions as sessions_endpoint
from app.models.group import GroupMember, GroupRole, StudyGroup
from app.models.resource import Resource
from app.models.session import SessionResource, StudySession
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.schemas.session import SessionCreate


class Boom(Exception):
    """Failure injected at the second write of a creation path."""


# --- group creation -------------------------------------------------------


def test_create_group_persists_group_and_organizer(db):
    group = group_repo.create_group(
        db=db, group_in=StudyGroupCreate(name="OS Study Group"), user_id=7
    )

    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    assert len(members) == 1
    assert members[0].user_id == 7
    assert members[0].role == GroupRole.ORGANIZER


def test_create_group_rolls_back_the_group_when_adding_the_organizer_fails(db, monkeypatch):
    def explode(*args, **kwargs):
        raise Boom("organizer insert failed")

    monkeypatch.setattr(group_repo, "GroupMember", explode)

    with pytest.raises(Boom):
        group_repo.create_group(
            db=db, group_in=StudyGroupCreate(name="OS Study Group"), user_id=7
        )

    # Before the fix this left an orphan group: unusable, and undeletable
    # because deletion requires the ORGANIZER role.
    assert db.query(StudyGroup).count() == 0
    assert db.query(GroupMember).count() == 0


def test_create_group_leaves_no_usable_session_open_after_failure(db, monkeypatch):
    """The failed transaction must not poison the next write."""
    monkeypatch.setattr(group_repo, "GroupMember", lambda *a, **k: (_ for _ in ()).throw(Boom()))

    with pytest.raises(Boom):
        group_repo.create_group(db=db, group_in=StudyGroupCreate(name="First"), user_id=7)

    monkeypatch.undo()

    group = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Second"), user_id=7)
    assert group.id is not None
    assert db.query(StudyGroup).count() == 1


# --- session creation -----------------------------------------------------


def _seed_group_with_resource(db):
    group = group_repo.create_group(
        db=db, group_in=StudyGroupCreate(name="OS Study Group"), user_id=7
    )
    resource = Resource(
        group_id=group.id,
        uploaded_by=7,
        filename="uuid-1.pdf",
        original_filename="os-notes.pdf",
        mime_type="application/pdf",
        size=1024,
        storage_path=f"groups/{group.id}/uuid-1.pdf",
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return group, resource


def _session_payload(group_id: int, resource_ids: list[int]) -> SessionCreate:
    return SessionCreate(
        group_id=group_id,
        title="Paging revision",
        scheduled_at=datetime(2026, 10, 1, 10, 0, 0),
        duration_minutes=60,
        resource_ids=resource_ids,
    )


def test_create_session_persists_session_and_resource_links(db, monkeypatch):
    monkeypatch.setattr(
        sessions_endpoint.notification_service, "notify_group_members", lambda **kwargs: None
    )
    group, resource = _seed_group_with_resource(db)

    sessions_endpoint.create_session(
        session_in=_session_payload(group.id, [resource.id]),
        db=db,
        user={"userId": 7},
    )

    session = db.query(StudySession).one()
    links = db.query(SessionResource).filter(SessionResource.session_id == session.id).all()
    assert [link.resource_id for link in links] == [resource.id]


def test_create_session_rolls_back_when_attaching_resources_fails(db, monkeypatch):
    monkeypatch.setattr(
        sessions_endpoint.notification_service, "notify_group_members", lambda **kwargs: None
    )
    group, resource = _seed_group_with_resource(db)

    def explode(*args, **kwargs):
        raise Boom("resource link insert failed")

    monkeypatch.setattr(sessions_endpoint, "SessionResource", explode)

    with pytest.raises(Boom):
        sessions_endpoint.create_session(
            session_in=_session_payload(group.id, [resource.id]),
            db=db,
            user={"userId": 7},
        )

    # Before the fix the session was already committed, so it survived with
    # none of the resources it was created to cover.
    assert db.query(StudySession).count() == 0
    assert db.query(SessionResource).count() == 0


def test_create_session_with_no_resources_still_commits(db, monkeypatch):
    monkeypatch.setattr(
        sessions_endpoint.notification_service, "notify_group_members", lambda **kwargs: None
    )
    group, _ = _seed_group_with_resource(db)

    sessions_endpoint.create_session(
        session_in=_session_payload(group.id, []),
        db=db,
        user={"userId": 7},
    )

    assert db.query(StudySession).count() == 1
    assert db.query(SessionResource).count() == 0


def test_create_session_ignores_resources_from_another_group(db, monkeypatch):
    """Pre-existing behaviour: a foreign resource id is skipped, not linked."""
    monkeypatch.setattr(
        sessions_endpoint.notification_service, "notify_group_members", lambda **kwargs: None
    )
    group, _ = _seed_group_with_resource(db)
    other_group = group_repo.create_group(
        db=db, group_in=StudyGroupCreate(name="Other"), user_id=7
    )
    foreign = Resource(
        group_id=other_group.id,
        uploaded_by=7,
        filename="uuid-2.pdf",
        original_filename="other.pdf",
        mime_type="application/pdf",
        size=10,
        storage_path=f"groups/{other_group.id}/uuid-2.pdf",
    )
    db.add(foreign)
    db.commit()
    db.refresh(foreign)

    sessions_endpoint.create_session(
        session_in=_session_payload(group.id, [foreign.id]),
        db=db,
        user={"userId": 7},
    )

    assert db.query(StudySession).count() == 1
    assert db.query(SessionResource).count() == 0
