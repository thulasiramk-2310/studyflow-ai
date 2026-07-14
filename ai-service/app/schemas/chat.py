from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ChatRequest(BaseModel):
    groupId: int
    query: str
    sessionId: Optional[int] = None
    userId: Optional[int] = None # Added by study-service proxy

class ChatCitation(BaseModel):
    filename: str
    page: int
    score: float

class ChatResponse(BaseModel):
    success: bool
    answer: str
    confidence: float
    citations: List[ChatCitation]
    sessionId: Optional[int] = None

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    citations: Optional[List[ChatCitation]] = None
    model: Optional[str] = None
    prompt_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0
    total_tokens: Optional[int] = 0
    latency_ms: Optional[int] = 0
    retrieved_chunk_count: Optional[int] = 0
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    group_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
