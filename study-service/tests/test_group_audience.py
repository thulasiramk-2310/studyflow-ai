"""Each group stores the audience its shared AI content is written for."""

from __future__ import annotations

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.endpoints import groups as groups_endpoint
from app.core.config import settings
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate, StudyGroupUpdate

ORGANIZER, MEMBER = 7, 8


def test_a_new_group_defaults_to_student(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS"), user_id=ORGANIZER)
    assert g.audience == "student"


def test_a_group_can_be_created_for_a_team(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="Platform", audience="professional"), user_id=ORGANIZER)
    assert g.audience == "professional"


def test_an_unknown_audience_is_rejected():
    with pytest.raises(ValidationError):
        StudyGroupCreate(name="OS", audience="executive")


def test_the_organizer_can_change_the_audience_and_a_member_cannot(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS"), user_id=ORGANIZER)
    group_repo.add_member(db=db, group_id=g.id, user_id=MEMBER)

    with pytest.raises(HTTPException) as denied:
        groups_endpoint.update_group(g.id, StudyGroupUpdate(name="OS", audience="professional"), db=db, current_user={"userId": MEMBER})
    assert denied.value.status_code == 403

    groups_endpoint.update_group(g.id, StudyGroupUpdate(name="OS", audience="professional"), db=db, current_user={"userId": ORGANIZER})
    db.refresh(g)
    assert g.audience == "professional"


def test_updating_without_an_audience_keeps_it(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS", audience="professional"), user_id=ORGANIZER)
    groups_endpoint.update_group(g.id, StudyGroupUpdate(name="OS renamed"), db=db, current_user={"userId": ORGANIZER})
    db.refresh(g)
    assert g.audience == "professional"


def test_internal_audience_requires_the_internal_key(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS", audience="professional"), user_id=ORGANIZER)

    assert groups_endpoint.get_group_audience_internal(g.id, db=db, internal_key=settings.INTERNAL_API_KEY) == {"audience": "professional"}
    with pytest.raises(HTTPException) as bad:
        groups_endpoint.get_group_audience_internal(g.id, db=db, internal_key="wrong")
    assert bad.value.status_code == 403
    with pytest.raises(HTTPException) as missing:
        groups_endpoint.get_group_audience_internal(999, db=db, internal_key=settings.INTERNAL_API_KEY)
    assert missing.value.status_code == 404
