import logging
from fastapi import FastAPI, Request
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from app.core.database import engine, Base
import app.models.chat # Ensure models are imported before create_all
# Do NOT create tables automatically in production, use Alembic via ECS task instead.
# Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = req_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

app.add_middleware(RequestIDMiddleware)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "StudyFlow AI Service"}

@app.get("/health")
def health_check():
    return {"status": "UP"}

from sqlalchemy import text
from app.core.database import get_db
from fastapi import Depends
import datetime

@app.get("/ready")
def ready_check(db=Depends(get_db)):
    ready = {
        "status": "UP",
        "service": "ai-service",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }
    try:
        db.execute(text("SELECT 1"))
        ready["database"] = "UP"
    except Exception as e:
        ready["database"] = "DOWN"
        ready["status"] = "DOWN"
    return ready
