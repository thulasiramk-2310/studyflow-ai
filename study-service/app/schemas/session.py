from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from app.models.session import SessionStatus, SummaryStatus, MeetingType, AttendanceStatus, StudySessionType
from typing import Literal
from app.schemas.common import UTCDateTime

# Models invent activity types ("lecture", "exercise"); map them onto the six the UI knows
# instead of rejecting the whole plan.
ACTIVITY_TYPES = ("revision", "learning", "practice", "discussion", "quiz", "break")
_ACTIVITY_SYNONYMS = {
    "lecture": "learning", "lesson": "learning", "introduction": "learning", "intro": "learning",
    "presentation": "learning", "reading": "learning", "concept": "learning", "theory": "learning",
    "review": "revision", "recap": "revision", "summary": "revision", "wrap-up": "revision", "wrap up": "revision",
    "exercise": "practice", "exercises": "practice", "problem solving": "practice", "hands-on": "practice",
    "lab": "practice", "case study": "practice", "activity": "practice", "drill": "practice",
    "q&a": "discussion", "qa": "discussion", "group discussion": "discussion", "debate": "discussion",
    "brainstorm": "discussion",
    "assessment": "quiz", "test": "quiz", "knowledge check": "quiz", "quiz review": "quiz",
    "rest": "break", "pause": "break",
}


def normalize_activity_type(value) -> str:
    text = str(value or "").strip().lower()
    if text in ACTIVITY_TYPES:
        return text
    return _ACTIVITY_SYNONYMS.get(text, "learning")


class AgendaItem(BaseModel):
    title: str
    duration_minutes: int = 0
    description: str = ""
    activity_type: Literal[
        "revision",
        "learning",
        "practice",
        "discussion",
        "quiz",
        "break"
    ] = "learning"

    @field_validator("activity_type", mode="before")
    @classmethod
    def map_activity_type(cls, v):
        return normalize_activity_type(v)

class ActionItem(BaseModel):
    task: str = Field(..., min_length=1, max_length=500)
    owner: Optional[str] = Field(None, max_length=100)
    due: Optional[str] = Field(None, max_length=100)


class SessionSummaryResponse(BaseModel):
    id: int
    session_id: int
    summary: Optional[str] = None
    key_concepts: Optional[List[str]] = None
    important_points: Optional[List[str]] = None
    action_items: Optional[List[Union[ActionItem, str]]] = None
    decisions: Optional[List[str]] = None
    open_questions: Optional[List[str]] = None
    source: Optional[str] = None
    review_status: Optional[str] = None
    approved_at: Optional[UTCDateTime] = None
    status: SummaryStatus
    model: Optional[str] = None
    generated_at: Optional[UTCDateTime] = None
    generation_time_ms: Optional[int] = None

    class Config:
        from_attributes = True


class TranscriptNotes(BaseModel):
    text: str


class TranscriptResponse(BaseModel):
    text: str
    source: str
    by: Optional[int] = None
    by_name: Optional[str] = None
    at: Optional[UTCDateTime] = None


class MinutesUpdate(BaseModel):
    summary: Optional[str] = Field(None, max_length=20_000)
    key_concepts: Optional[List[str]] = None
    important_points: Optional[List[str]] = None
    decisions: Optional[List[str]] = None
    open_questions: Optional[List[str]] = None
    action_items: Optional[List[ActionItem]] = None

from datetime import timezone

class SessionBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    agenda: Optional[List[AgendaItem]] = None
    objectives: Optional[List[str]] = None
    expected_outcome: Optional[str] = None
    session_type: Optional[StudySessionType] = StudySessionType.OTHER
    learning_path_item_id: Optional[int] = None
    generated_by_ai: Optional[bool] = False
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
    agenda: Optional[List[AgendaItem]] = None
    objectives: Optional[List[str]] = None
    expected_outcome: Optional[str] = None
    session_type: Optional[StudySessionType] = None
    learning_path_item_id: Optional[int] = None
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
    created_at: UTCDateTime
    updated_at: UTCDateTime
    resources: List[SessionResourceResponse] = []
    meeting_transcript_source: Optional[str] = None
    meeting_transcript_by: Optional[int] = None
    meeting_transcript_at: Optional[UTCDateTime] = None

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
