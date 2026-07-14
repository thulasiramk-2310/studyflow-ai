from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class FlashcardDeckStatus(str, enum.Enum):
    PENDING = "PENDING"
    GENERATING = "GENERATING"
    READY = "READY"
    FAILED = "FAILED"

class FlashcardProgressStatus(str, enum.Enum):
    NEW = "NEW"
    LEARNING = "LEARNING"
    MASTERED = "MASTERED"

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    status = Column(Enum(FlashcardDeckStatus), default=FlashcardDeckStatus.PENDING, nullable=False)
    model = Column(String(50), nullable=True)
    generated_at = Column(DateTime, nullable=True)
    generation_time_ms = Column(Integer, nullable=True)

    session = relationship("StudySession", back_populates="flashcard_deck")
    flashcards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan", order_by="Flashcard.order_index")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    difficulty = Column(String(50), nullable=True) # Easy, Medium, Hard
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    deck = relationship("FlashcardDeck", back_populates="flashcards")
    progress = relationship("FlashcardProgress", back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardProgress(Base):
    __tablename__ = "flashcard_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False) # ID from auth_db
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(Enum(FlashcardProgressStatus), default=FlashcardProgressStatus.NEW, nullable=False)
    last_reviewed = Column(DateTime, nullable=True)

    flashcard = relationship("Flashcard", back_populates="progress")
