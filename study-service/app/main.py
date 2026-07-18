from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.core.database import Base, engine
import datetime
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Do NOT create tables automatically in production, use Alembic via ECS task instead.
# Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, root_path="/study")
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": {"code": "422", "message": str(exc.errors())}},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP error occurred: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": str(exc.status_code), "message": exc.detail}},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "500", "message": "Internal Server Error"}},
    )

import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = req_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.VITE_API_URL] if hasattr(settings, 'VITE_API_URL') else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(api_router)

from app.api.endpoints import health
app.include_router(health.router, prefix="/system/health", tags=["system"])

@app.get("/health")
def health_check():
    return {"status": "UP"}

from sqlalchemy import text
from app.core.database import get_db

@app.get("/ready")
def ready_check(db=Depends(get_db)):
    ready = {
        "status": "UP",
        "service": "study-service",
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
