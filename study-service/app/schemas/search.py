from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SearchResult(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    type: str # 'group', 'resource', 'session', 'quiz', 'flashcard', 'chat'
    url: str
    group_id: Optional[int] = None
    created_at: Optional[datetime] = None

class SearchResponse(BaseModel):
    groups: List[SearchResult] = []
    resources: List[SearchResult] = []
    sessions: List[SearchResult] = []
    quizzes: List[SearchResult] = []
    flashcards: List[SearchResult] = []
    chatSessions: List[SearchResult] = []
