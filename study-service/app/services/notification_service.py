from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.group import GroupMember
import logging

logger = logging.getLogger(__name__)

def create_notification(db: Session, user_id: int, title: str, message: str, type: NotificationType, group_id: int = None, entity_type: str = None, entity_id: int = None):
    try:
        notif = Notification(
            user_id=user_id,
            group_id=group_id,
            title=title,
            message=message,
            type=type,
            entity_type=entity_type,
            entity_id=entity_id
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        db.rollback()
        return None

def notify_group_members(db: Session, group_id: int, title: str, message: str, type: NotificationType, exclude_user_id: int = None, entity_type: str = None, entity_id: int = None):
    try:
        members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
        notifs = []
        for m in members:
            if exclude_user_id and m.user_id == exclude_user_id:
                continue
            notif = Notification(
                user_id=m.user_id,
                group_id=group_id,
                title=title,
                message=message,
                type=type,
                entity_type=entity_type,
                entity_id=entity_id
            )
            notifs.append(notif)
        
        if notifs:
            db.add_all(notifs)
            db.commit()
            return len(notifs)
        return 0
    except Exception as e:
        logger.error(f"Failed to notify group members: {e}")
        db.rollback()
        return 0

def mark_read(db: Session, notification_id: int, user_id: int):
    try:
        notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
        if notif and not notif.is_read:
            notif.is_read = True
            db.commit()
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to mark notification read: {e}")
        db.rollback()
        return False

def mark_all_read(db: Session, user_id: int):
    try:
        db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
        db.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to mark all notifications read: {e}")
        db.rollback()
        return False
