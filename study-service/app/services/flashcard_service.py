import httpx
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.flashcard import FlashcardDeck, Flashcard, FlashcardDeckStatus
from datetime import datetime
import time
import os

logger = logging.getLogger(__name__)

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8002")

def generate_flashcards_task(session_id: int, group_id: int, resource_ids: list[int], count: int = 15):
    """
    Background task to generate flashcards for a session.
    """
    db = SessionLocal()
    try:
        # Create or update flashcard deck to GENERATING
        deck = db.query(FlashcardDeck).filter(FlashcardDeck.session_id == session_id).first()
        if not deck:
            deck = FlashcardDeck(session_id=session_id, status=FlashcardDeckStatus.GENERATING)
            db.add(deck)
        else:
            deck.status = FlashcardDeckStatus.GENERATING
            # Delete old cards
            for c in deck.flashcards:
                db.delete(c)
        db.commit()
        db.refresh(deck)

        if not resource_ids:
            deck.status = FlashcardDeckStatus.FAILED
            deck.generated_at = datetime.utcnow()
            db.commit()
            return

        # Call AI Service
        start_time = time.time()
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{AI_SERVICE_URL}/api/v1/ai/flashcards",
                    json={
                        "sessionId": session_id,
                        "groupId": group_id,
                        "resourceIds": resource_ids,
                        "count": count
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("success"):
                    deck_data = data.get("data", {})
                    deck.model = deck_data.get("model", "qwen3:8b")
                    
                    cards = deck_data.get("flashcards", [])
                    for c_data in cards:
                        db_c = Flashcard(
                            deck_id=deck.id,
                            front=c_data.get("front", ""),
                            back=c_data.get("back", ""),
                            difficulty=c_data.get("difficulty"),
                            order_index=c_data.get("order_index", 0)
                        )
                        db.add(db_c)
                    
                    deck.status = FlashcardDeckStatus.READY
                    deck.generation_time_ms = int((time.time() - start_time) * 1000)
                    deck.generated_at = datetime.utcnow()
                else:
                    deck.status = FlashcardDeckStatus.FAILED
            
            db.commit()
            
            if deck.status == FlashcardDeckStatus.READY:
                from app.services.notification_service import notify_group_members
                from app.models.notification import NotificationType
                notify_group_members(
                    db=db,
                    group_id=group_id,
                    title="Flashcards Ready",
                    message="AI Flashcards have been generated.",
                    type=NotificationType.FLASHCARDS_READY,
                    entity_type="SESSION",
                    entity_id=session_id
                )
            
        except Exception as e:
            logger.error(f"Failed to generate flashcards via AI Service: {e}")
            deck.status = FlashcardDeckStatus.FAILED
            db.commit()

    except Exception as e:
        logger.error(f"Error in generate_flashcards_task: {e}")
    finally:
        db.close()
