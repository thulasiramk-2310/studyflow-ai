"""Meeting transcripts: limits, timing and file parsing (done by ai-service)."""

from __future__ import annotations

import base64
import os
from datetime import datetime

import httpx

from app.core.config import settings
from app.models.session import SessionStatus

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8002")

MAX_TRANSCRIPT_CHARS = 200_000
MAX_TRANSCRIPT_FILE_BYTES = 5 * 1024 * 1024
TRANSCRIPT_EXTENSIONS = (".vtt", ".txt", ".docx")


class TranscriptParseError(Exception):
    """The file was received but is not a readable transcript."""


def transcript_window_open(session, now: datetime | None = None) -> bool:
    if session.status == SessionStatus.CANCELLED:
        return False
    if session.status in (SessionStatus.LIVE, SessionStatus.COMPLETED):
        return True
    return session.scheduled_at <= (now or datetime.utcnow())


def parse_transcript_file(filename: str, data: bytes) -> str:
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{AI_SERVICE_URL}/api/v1/ai/transcript/parse",
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY},
            json={"filename": filename, "content_base64": base64.b64encode(data).decode("ascii")},
        )
    if response.status_code == 400:
        raise TranscriptParseError(response.json().get("detail") or "This transcript could not be read.")
    response.raise_for_status()
    return response.json()["data"]["text"]
