from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.quiz import QuizStatus, QuestionType

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]] = None
    correct_answer: str
    explanation: Optional[str] = None
    
    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: int
    session_id: int
    status: QuizStatus
    model: Optional[str] = None
    generated_at: Optional[datetime] = None
    questions: List[QuizQuestionResponse] = []
    
    class Config:
        from_attributes = True
