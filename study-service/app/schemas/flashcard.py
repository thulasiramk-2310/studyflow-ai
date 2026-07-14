from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.flashcard import FlashcardDeckStatus, FlashcardProgressStatus

class FlashcardBase(BaseModel):
    front: str
    back: str
    difficulty: Optional[str] = None
    order_index: int

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardResponse(FlashcardBase):
    id: int
    deck_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FlashcardDeckBase(BaseModel):
    session_id: int

class FlashcardDeckCreate(FlashcardDeckBase):
    pass

class FlashcardDeckResponse(FlashcardDeckBase):
    id: int
    status: FlashcardDeckStatus
    model: Optional[str] = None
    generated_at: Optional[datetime] = None
    generation_time_ms: Optional[int] = None
    flashcards: List[FlashcardResponse] = []

    class Config:
        from_attributes = True

class FlashcardGenerateRequest(BaseModel):
    count: int = 15
