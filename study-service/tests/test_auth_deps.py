"""Tokens from auth-service must survive small clock differences between containers."""

from __future__ import annotations

import time

import jwt
import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api.deps import get_current_user
from app.core.config import settings


def _request_with(token: str) -> Request:
    return Request({"type": "http", "headers": [(b"cookie", f"jwt={token}".encode())]})


def _token(iat_offset: float, exp_offset: float = 3600, key: str | None = None) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": "a@b.c", "userId": 7, "iat": now + int(iat_offset), "exp": now + int(exp_offset)},
        key or settings.JWT_SECRET,
        algorithm="HS512",
    )


def test_token_issued_slightly_in_the_future_is_accepted():
    payload = get_current_user(_request_with(_token(iat_offset=3)))
    assert payload["userId"] == 7


def test_token_signed_with_another_key_is_rejected():
    with pytest.raises(HTTPException) as exc:
        get_current_user(_request_with(_token(iat_offset=0, key="not-the-secret-" * 4)))
    assert exc.value.status_code == 401


def test_expired_token_is_rejected():
    with pytest.raises(HTTPException) as exc:
        get_current_user(_request_with(_token(iat_offset=-7200, exp_offset=-3600)))
    assert exc.value.detail == "Token has expired"
