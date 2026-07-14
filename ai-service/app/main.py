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
Base.metadata.create_all(bind=engine)

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
    return {"status": "UP", "service": "ai-service"}
