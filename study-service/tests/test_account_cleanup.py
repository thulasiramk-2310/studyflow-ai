"""Deleting an account removes the user's study data, but never another member's group."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.endpoints import internal as internal_endpoint
from app.core.config import settings
from app.models.group import GroupMember, StudyGroup
from app.models.notification import Notification, NotificationType
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate

LEAVER, FRIEND = 7, 8
KEY = settings.INTERNAL_API_KEY


def _group(db, owner, name, members=()):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name=name), user_id=owner)
    for m in members:
        group_repo.add_member(db=db, group_id=g.id, user_id=m)
    return g


def test_owning_a_group_with_other_members_blocks_deletion(db):
    _group(db, LEAVER, "OS Study Group", members=[FRIEND])

    with pytest.raises(HTTPException) as blocked:
        internal_endpoint.remove_user(LEAVER, db=db, internal_key=KEY)

    assert blocked.value.status_code == 409
    assert "OS Study Group" in blocked.value.detail
    assert db.query(GroupMember).filter(GroupMember.user_id == LEAVER).count() == 1  # nothing removed


def test_solo_groups_and_memberships_are_removed(db):
    solo = _group(db, LEAVER, "My notes")
    shared = _group(db, FRIEND, "Friend's group", members=[LEAVER])
    db.add(Notification(user_id=LEAVER, title="hi", type=list(NotificationType)[0], is_read=False))
    db.commit()

    result = internal_endpoint.remove_user(LEAVER, db=db, internal_key=KEY)

    assert result == {"deleted_groups": 1}
    assert db.query(StudyGroup).filter(StudyGroup.id == solo.id).count() == 0
    assert db.query(StudyGroup).filter(StudyGroup.id == shared.id).count() == 1  # friend's group survives
    assert db.query(GroupMember).filter(GroupMember.user_id == LEAVER).count() == 0
    assert db.query(GroupMember).filter(GroupMember.user_id == FRIEND).count() == 1
    assert db.query(Notification).filter(Notification.user_id == LEAVER).count() == 0


def test_cleanup_requires_the_internal_key(db):
    with pytest.raises(HTTPException) as denied:
        internal_endpoint.remove_user(LEAVER, db=db, internal_key="wrong")
    assert denied.value.status_code == 403


def test_a_user_with_no_data_is_fine(db):
    assert internal_endpoint.remove_user(999, db=db, internal_key=KEY) == {"deleted_groups": 0}
