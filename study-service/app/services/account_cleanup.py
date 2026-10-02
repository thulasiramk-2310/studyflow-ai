"""Remove a user's study data when they delete their account."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.flashcard import FlashcardProgress
from app.models.group import GroupMember, GroupRole, StudyGroup
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.session import SessionAttendance


class OwnsSharedGroups(Exception):
    def __init__(self, names: list[str]):
        self.names = names
        super().__init__(", ".join(names))


def remove_user_data(db: Session, user_id: int) -> int:
    """Delete the user's solo groups and personal rows. Returns how many groups were deleted.

    Raises OwnsSharedGroups (and changes nothing) while they organise a group with other
    members: deleting it would take other people's work with it. Notes and sessions they
    created in other people's groups stay; they belong to the group.
    """
    owned = (
        db.query(StudyGroup)
        .join(GroupMember, GroupMember.group_id == StudyGroup.id)
        .filter(GroupMember.user_id == user_id, GroupMember.role == GroupRole.ORGANIZER)
        .all()
    )
    shared = [g for g in owned if db.query(GroupMember).filter(GroupMember.group_id == g.id).count() > 1]
    if shared:
        raise OwnsSharedGroups([g.name for g in shared])

    for group in owned:
        db.delete(group)  # cascades to members, sessions, resources, learning path
    db.query(GroupMember).filter(GroupMember.user_id == user_id).delete(synchronize_session=False)
    db.query(SessionAttendance).filter(SessionAttendance.user_id == user_id).delete(synchronize_session=False)
    db.query(FlashcardProgress).filter(FlashcardProgress.user_id == user_id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
    db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).delete(synchronize_session=False)
    db.commit()
    return len(owned)
