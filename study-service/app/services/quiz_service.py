import httpx
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.quiz import Quiz, QuizQuestion, QuizStatus
from datetime import datetime
import time
import os

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8002")

def generate_quiz_task(session_id: int, group_id: int, resource_ids: list[int]):
    """
    Background task to generate a quiz for a completed session.
    """
    db = SessionLocal()
    try:
        # Create or update quiz record to GENERATING
        quiz = db.query(Quiz).filter(Quiz.session_id == session_id).first()
        if not quiz:
            quiz = Quiz(session_id=session_id, status=QuizStatus.GENERATING)
            db.add(quiz)
        else:
            quiz.status = QuizStatus.GENERATING
            # Delete old questions
            for q in quiz.questions:
                db.delete(q)
        db.commit()
        db.refresh(quiz)

        if not resource_ids:
            quiz.status = QuizStatus.FAILED
            quiz.generated_at = datetime.utcnow()
            db.commit()
            return

        # Call AI Service
        start_time = time.time()
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{AI_SERVICE_URL}/api/v1/ai/quiz",
                    json={
                        "sessionId": session_id,
                        "groupId": group_id,
                        "resourceIds": resource_ids
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("success"):
                    quiz_data = data.get("data", {})
                    quiz.model = quiz_data.get("model", "qwen3:8b")
                    
                    questions = quiz_data.get("questions", [])
                    for q_data in questions:
                        db_q = QuizQuestion(
                            quiz_id=quiz.id,
                            question=q_data["question"],
                            question_type=q_data["question_type"],
                            options=q_data.get("options"),
                            correct_answer=q_data["correct_answer"],
                            explanation=q_data.get("explanation")
                        )
                        db.add(db_q)
                        
                    quiz.status = QuizStatus.READY
                else:
                    quiz.status = QuizStatus.FAILED
        except Exception as e:
            logger.error(f"Failed to generate quiz for session {session_id}: {e}")
            quiz.status = QuizStatus.FAILED

        end_time = time.time()
        quiz.generation_time_ms = int((end_time - start_time) * 1000)
        quiz.generated_at = datetime.utcnow()
        db.commit()
        
        if quiz.status == QuizStatus.READY:
            from app.services.notification_service import notify_group_members
            from app.models.notification import NotificationType
            notify_group_members(
                db=db,
                group_id=group_id,
                title="Quiz Ready",
                message="AI Quiz has been generated.",
                type=NotificationType.QUIZ_READY,
                entity_type="SESSION",
                entity_id=session_id
            )

    finally:
        db.close()
