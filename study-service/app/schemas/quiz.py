from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.quiz import QuizStatus, QuestionType

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]] = None
    
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

class QuizSubmission(BaseModel):
    answers: List[str]

class QuizQuestionResult(BaseModel):
    id: int
    correct_answer: str
    explanation: Optional[str] = None
    is_correct: bool

class QuizResult(BaseModel):
    score: int
    total: int
    percentage: float
    passed: bool
    results: List[QuizQuestionResult]
