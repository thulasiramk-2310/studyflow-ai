"""Notification settings are stored per user and actually stop notifications being created."""

from __future__ import annotations

from app.api.endpoints import notifications as notifications_endpoint
from app.models.notification import Notification, NotificationType
from app.repositories import group_repo
from app.schemas.group import StudyGroupCreate
from app.schemas.notification import NotificationPreferences
from app.services import notification_service

OWNER, MEMBER = 7, 8


def test_defaults_are_all_on(db):
    prefs = notifications_endpoint.get_preferences(db=db, user={"userId": MEMBER})["data"]
    assert prefs == NotificationPreferences(sessions=True, resources=True, ai_results=True, members=True)


def test_preferences_are_saved(db):
    notifications_endpoint.update_preferences(
        NotificationPreferences(sessions=True, resources=False, ai_results=True, members=False),
        db=db, user={"userId": MEMBER},
    )
    prefs = notifications_endpoint.get_preferences(db=db, user={"userId": MEMBER})["data"]
    assert (prefs.resources, prefs.members) == (False, False)


def test_a_muted_category_is_not_delivered(db):
    g = group_repo.create_group(db=db, group_in=StudyGroupCreate(name="OS"), user_id=OWNER)
    group_repo.add_member(db=db, group_id=g.id, user_id=MEMBER)
    notifications_endpoint.update_preferences(
        NotificationPreferences(sessions=True, resources=False, ai_results=True, members=True),
        db=db, user={"userId": MEMBER},
    )

    notification_service.notify_group_members(db=db, group_id=g.id, title="New notes", message="x",
                                              type=NotificationType.RESOURCE_UPLOADED, exclude_user_id=OWNER)
    notification_service.notify_group_members(db=db, group_id=g.id, title="Quiz ready", message="x",
                                              type=NotificationType.QUIZ_READY)

    member_titles = [n.title for n in db.query(Notification).filter(Notification.user_id == MEMBER)]
    assert member_titles == ["Quiz ready"]
    assert db.query(Notification).filter(Notification.user_id == OWNER).count() == 1  # owner kept defaults
