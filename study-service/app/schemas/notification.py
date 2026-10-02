from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.notification import NotificationType
from app.schemas.common import UTCDateTime

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
    created_at: UTCDateTime

    class Config:
        from_attributes = True

class NotificationPreferences(BaseModel):
    sessions: bool = True      # sessions created, updated, completed; call links
    resources: bool = True     # notes uploaded or removed
    ai_results: bool = True    # summaries, quizzes, flashcards and plans ready
    members: bool = True       # people joining or leaving

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    data: List[NotificationResponse]
    total: int
    page: int
    size: int
