from pydantic import BaseModel
from typing import List, Optional

class RetrieveRequest(BaseModel):
    groupId: int
    query: str
    topK: int = 5
    resourceIds: Optional[List[int]] = None  # For future filtering

class RetrieveSource(BaseModel):
    resourceId: int
    filename: str
    page: int

class RetrieveResult(BaseModel):
    score: float
    content: str
    source: RetrieveSource

class RetrieveResponse(BaseModel):
    success: bool
    query: str
    results: List[RetrieveResult]
