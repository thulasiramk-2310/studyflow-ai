from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    group_id: Optional[int] = None
    title: str
    message: Optional[str] = None
    type: NotificationType
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    data: List[NotificationResponse]
    total: int
    page: int
    size: int
