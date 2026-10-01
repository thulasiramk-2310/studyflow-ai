"""ai-service errors must reach the client as a plain message, not nested JSON."""

from __future__ import annotations

import httpx

from app.api.endpoints.ai import upstream_error


def test_json_detail_is_unwrapped():
    response = httpx.Response(503, json={"detail": "AI is temporarily unavailable. Please try again in a minute."})
    exc = upstream_error(response)
    assert exc.status_code == 503
    assert exc.detail == "AI is temporarily unavailable. Please try again in a minute."


def test_non_json_body_is_passed_through():
    response = httpx.Response(502, text="Bad Gateway")
    exc = upstream_error(response)
    assert exc.status_code == 502
    assert exc.detail == "Bad Gateway"
