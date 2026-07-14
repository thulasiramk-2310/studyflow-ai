from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services import notification_service

router = APIRouter()

@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100)
):
    user_id = current_user.get("userId")
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    total = query.count()
    unread_count = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()
    notifications = query.order_by(Notification.created_at.desc()).offset((page - 1) * size).limit(size).all()
    
    return {
        "data": notifications,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "size": size
    }

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    notification_service.mark_all_read(db, user_id)
    return {"message": "All notifications marked as read"}

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    success = notification_service.mark_read(db, notification_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("userId")
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
