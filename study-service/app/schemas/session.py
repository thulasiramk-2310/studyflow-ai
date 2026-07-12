from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.session import SessionStatus

class SessionBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    agenda: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int

    @field_validator('title')
    @classmethod
    def title_must_not_be_empty_and_strip(cls, v: str) -> str:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Title must be at least 2 characters after stripping whitespace')
        return v

class SessionCreate(SessionBase):
    group_id: int
    resource_ids: List[int] = []

class SessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    agenda: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[SessionStatus] = None

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
    created_by: int
    created_at: datetime
    updated_at: datetime
    resources: List[SessionResourceResponse] = []

    class Config:
        from_attributes = True
