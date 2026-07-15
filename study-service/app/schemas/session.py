from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.session import SessionStatus, SummaryStatus, MeetingType, AttendanceStatus

class SessionSummaryResponse(BaseModel):
    id: int
    session_id: int
    summary: Optional[str] = None
    key_concepts: Optional[List[str]] = None
    important_points: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    status: SummaryStatus
    model: Optional[str] = None
    generated_at: Optional[datetime] = None
    generation_time_ms: Optional[int] = None

    class Config:
        from_attributes = True

from datetime import timezone

class SessionBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    agenda: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int
    meeting_type: Optional[MeetingType] = MeetingType.NONE
    meeting_url: Optional[str] = None

    @field_validator('title')
    @classmethod
    def title_must_not_be_empty_and_strip(cls, v: str) -> str:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Title must be at least 2 characters after stripping whitespace')
        return v

    @field_validator('scheduled_at')
    @classmethod
    def ensure_utc(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class SessionCreate(SessionBase):
    group_id: int
    generated_by: Optional[str] = "MANUAL"
    resource_ids: List[int] = []

class SessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    agenda: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[SessionStatus] = None
    meeting_type: Optional[MeetingType] = None
    meeting_url: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    @field_validator('title')
    @classmethod
    def title_update_must_not_be_empty_and_strip(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Title must be at least 2 characters after stripping whitespace')
        return v

class SessionResourceResponse(BaseModel):
    id: int
    filename: str
    original_filename: str

    class Config:
        from_attributes = True

class SessionResponse(SessionBase):
    id: int
    group_id: int
    status: SessionStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    generated_by: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    resources: List[SessionResourceResponse] = []

    class Config:
        from_attributes = True

class SessionAttendanceResponse(BaseModel):
    user_id: int
    status: AttendanceStatus
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        from_attributes = True
