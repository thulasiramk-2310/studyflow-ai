"""Only a group's organizer may see its invite code - in the UI and in the API."""

from __future__ import annotations

import asyncio

import pytest

from app.api.endpoints import groups as groups_endpoint
from app.repositories import group_repo
from app.schemas.group import JoinGroupRequest, StudyGroupCreate

ORGANIZER, MEMBER, NEWCOMER = 7, 8, 9


@pytest.fixture
def group(db, monkeypatch):
    monkeypatch.setattr(groups_endpoint.notification_service, "notify_group_members", lambda **kwargs: None)

    async def no_profiles(user_ids):
        return []

    monkeypatch.setattr(groups_endpoint.auth_client, "get_users_batch", no_profiles)
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS"), user_id=ORGANIZER)
    group_repo.add_member(db=db, group_id=g.id, user_id=MEMBER)
    return g


def _listed_code(db, user_id):
    data = groups_endpoint.get_user_groups(db=db, current_user={"userId": user_id})["data"]
    return data[0]["invite_code"]


def _detail_code(db, group_id, user_id):
    data = asyncio.run(groups_endpoint.get_group(group_id, db=db, current_user={"userId": user_id}))["data"]
    return data["invite_code"]


def test_the_organizer_sees_the_invite_code(db, group):
    assert _listed_code(db, ORGANIZER) == group.invite_code
    assert _detail_code(db, group.id, ORGANIZER) == group.invite_code


def test_a_member_does_not_receive_the_invite_code(db, group):
    assert _listed_code(db, MEMBER) is None
    assert _detail_code(db, group.id, MEMBER) is None


def test_joining_does_not_hand_back_the_invite_code(db, group):
    data = groups_endpoint.join_group(
        JoinGroupRequest(inviteCode=group.invite_code), db=db, current_user={"userId": NEWCOMER}
    )["data"]
    code = data["invite_code"] if isinstance(data, dict) else data.invite_code
    assert code is None
