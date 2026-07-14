from fastapi import APIRouter
from sqlalchemy import text
from app.core.database import SessionLocal
import httpx

router = APIRouter()

@router.get("/")
async def health_check():
    status_map = {
        "study_service": "🟢",
        "auth_service": "🔴",
        "ai_service": "🔴",
        "postgres": "🔴",
        "ollama": "🔴"
    }

    # Postgres
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        status_map["postgres"] = "🟢"
    except:
        pass
    finally:
        db.close()
        
    # Storage
    try:
        from app.services.storage import storage, LocalStorageService
        if isinstance(storage, LocalStorageService):
            status_map["storage (local)"] = "🟢"
        else:
            storage.exists("health-check-key")
            status_map["storage (s3)"] = "🟢"
    except Exception as e:
        status_map["storage"] = "🔴"

    async with httpx.AsyncClient() as client:
        # Auth
        try:
            r = await client.get("http://auth-service:8080/auth/health", timeout=2.0)
            if r.status_code == 200: status_map["auth_service"] = "🟢"
        except:
            pass

        # AI
        try:
            r = await client.get("http://studyflow_ai:8002/api/v1/health", timeout=2.0)
            if r.status_code == 200: status_map["ai_service"] = "🟢"
        except:
            pass
            
        # Ollama
        try:
            r = await client.get("http://ollama:11434/", timeout=2.0)
            if r.status_code == 200: status_map["ollama"] = "🟢"
        except:
            pass

    return status_map
