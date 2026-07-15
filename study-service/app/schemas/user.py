from pydantic import BaseModel
from typing import List, Optional

class DashboardStats(BaseModel):
    groups: int
    resources: int
    sessions: int
    conversations: int
    quizzes: int
    flashcards: int

class RecentActivityItem(BaseModel):
    type: str  # RESOURCE, SESSION, QUIZ, FLASHCARDS, SUMMARY
    title: str
    time: str

class UpcomingSessionItem(BaseModel):
    id: int
    title: str
    group_name: str
    scheduled_at: str

class RecentResourceItem(BaseModel):
    id: int
    title: str
    group_name: str
    time: str

class DashboardResponse(BaseModel):
    stats: DashboardStats
    upcoming_sessions: List[UpcomingSessionItem]
    recent_resources: List[RecentResourceItem]
    recent_activity: List[RecentActivityItem]
