from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db, SessionLocal
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, ChatCitation, ChatSessionResponse, ChatMessageResponse
from app.services.rag import generate_rag_response
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def verify_internal_key(x_internal_key: str = Header(...)):
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal key")

router = APIRouter(dependencies=[Depends(verify_internal_key)])

async def generate_chat_title(session_id: int, first_query: str):
    """Generate a title for a chat session using LLM, with fallback to truncated query."""
    db = SessionLocal()
    try:
        from app.services.llm_service import generate_answer
        # Use a very concise prompt to get a short title
        prompt = f"Summarize this into a 3-5 word title, no quotes or punctuation: {first_query[:200]}"
        raw = generate_answer(prompt)
        # Clean up common LLM artifacts
        title = raw.replace('"', '').replace("'", "").replace("**", "").strip()
        # Remove leading "Title: " or similar prefixes
        for prefix in ["Title:", "title:", "Title -", "Summary:"]:
            if title.startswith(prefix):
                title = title[len(prefix):].strip()
        title = title[:100] if title else None
        
        if not title:
            # Fallback: use truncated query
            title = first_query[:50].strip()
            if len(first_query) > 50:
                title += "..."
        
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.title = title
            db.commit()
            logger.info(f"Generated title for session {session_id}: {title}")
    except Exception as e:
        logger.warning(f"LLM title generation failed for session {session_id}: {e}. Using fallback.")
        # Fallback: use truncated query as title
        try:
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session and session.title == "New Conversation":
                fallback = first_query[:50].strip()
                if len(first_query) > 50:
                    fallback += "..."
                session.title = fallback
                db.commit()
                logger.info(f"Set fallback title for session {session_id}: {fallback}")
        except Exception as e2:
            logger.error(f"Failed to set fallback title: {e2}")
    finally:
        db.close()

@router.post("")
async def chat_with_documents(request: ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Generate an answer using RAG based on uploaded study materials, with chat history.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    if request.userId is None:
        raise HTTPException(status_code=401, detail="User ID is required")

    session_id = request.sessionId
    
    if session_id:
        # Verify session ownership
        chat_session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.deleted_at == None).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if chat_session.user_id != request.userId or chat_session.group_id != request.groupId:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Retry title generation if still "New Conversation"
        if chat_session.title == "New Conversation":
            background_tasks.add_task(generate_chat_title, session_id, request.query)

    else:
        # Create new session with immediate fallback title from query
        immediate_title = request.query[:50].strip()
        if len(request.query) > 50:
            immediate_title += "..."
        chat_session = ChatSession(
            user_id=request.userId,
            group_id=request.groupId,
            title=immediate_title
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)
        session_id = chat_session.id
        logger.info(f"Chat Created: Session {session_id} by User {request.userId}")
        
        # Dispatch background task for a better AI-generated title
        background_tasks.add_task(generate_chat_title, session_id, request.query)
        
    # Fetch last 4 messages for context
    history_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    recent_history = history_messages[-4:] if history_messages else []

    # Call RAG Pipeline
    start_time = datetime.utcnow()
    chat_response = generate_rag_response(request.groupId, request.query, history_messages=recent_history)
    latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    # Save User Message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=request.query,
    )
    db.add(user_msg)
    
    # Save AI Message
    ai_msg = ChatMessage(
        session_id=session_id,
        role="ai",
        content=chat_response.answer,
        citations=[c.model_dump() for c in chat_response.citations],
        model=settings.GROQ_MODEL,
        latency_ms=latency_ms,
        retrieved_chunk_count=len(chat_response.citations)
    )
    db.add(ai_msg)
    
    chat_session.updated_at = datetime.utcnow()
    db.commit()
    logger.info(f"Message Sent: Session {session_id} by User {request.userId}")

    chat_response.sessionId = session_id
    return {"success": True, "data": chat_response.model_dump()}

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(group_id: int, user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(
        ChatSession.group_id == group_id,
        ChatSession.user_id == user_id,
        ChatSession.deleted_at == None
    ).order_by(ChatSession.updated_at.desc()).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=List[ChatMessageResponse])
async def get_chat_session_messages(session_id: int, user_id: int, group_id: int, limit: int = 30, offset: int = 0, db: Session = Depends(get_db)):
    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.deleted_at == None).first()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if chat_session.user_id != user_id or chat_session.group_id != group_id:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).offset(offset).limit(limit).all()
    return messages

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: int, user_id: int, group_id: int, db: Session = Depends(get_db)):
    chat_session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.deleted_at == None).first()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if chat_session.user_id != user_id or chat_session.group_id != group_id:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    chat_session.deleted_at = datetime.utcnow()
    db.commit()
    logger.info(f"Chat Deleted: Session {session_id} by User {user_id}")
    return {"success": True, "message": "Session deleted"}

@router.get("/stats")
async def get_chat_stats(user_id: int, db: Session = Depends(get_db)):
    count = db.query(ChatSession).filter(
        ChatSession.user_id == user_id,
        ChatSession.deleted_at == None
    ).count()
    
    questions_count = db.query(ChatMessage).join(
        ChatSession, ChatMessage.session_id == ChatSession.id
    ).filter(
        ChatSession.user_id == user_id,
        ChatSession.deleted_at == None,
        ChatMessage.role == 'user'
    ).count()
    
    return {"success": True, "data": {"total_ai_chats": count, "total_questions_asked": questions_count}}
