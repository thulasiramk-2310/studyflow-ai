from pydantic import BaseModel
from typing import List, Optional
from app.schemas.retrieval import RetrieveSource

class ChatRequest(BaseModel):
    groupId: int
    query: str

class ChatCitation(BaseModel):
    filename: str
    page: int
    score: float

class ChatResponse(BaseModel):
    success: bool
    answer: str
    confidence: float
    citations: List[ChatCitation]
