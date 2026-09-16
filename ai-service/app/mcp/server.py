"""MCP surface mounted on the existing FastAPI app.

`GET /mcp/tools` is a static listing. `POST /mcp/tools/{tool_name}` invokes a
tool. Both sit behind the same `X-Internal-Key` dependency as every other route
in this service - one of the tools performs a write, so the surface is
default-deny rather than open.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.mcp.tools import HANDLERS, TOOL_NAMES, ToolError, list_tools

logger = logging.getLogger(__name__)


def verify_internal_key(x_internal_key: str = Header(...)):
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal key")


router = APIRouter(prefix="/mcp", tags=["mcp"], dependencies=[Depends(verify_internal_key)])


class ToolCall(BaseModel):
    arguments: dict[str, Any] = Field(default_factory=dict)


@router.get("/tools")
def get_tools() -> dict[str, Any]:
    """List the tools and their JSON schemas. Serves without any credentials
    beyond the internal key - no model call, no vector index."""
    tools = list_tools()
    return {"success": True, "count": len(tools), "tools": tools}


@router.post("/tools/{tool_name}")
def call_tool(tool_name: str, call: ToolCall) -> dict[str, Any]:
    if tool_name not in TOOL_NAMES:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_name}")

    handler = HANDLERS[tool_name]

    try:
        result = handler(**call.arguments)
    except ToolError as exc:
        logger.warning(f"MCP tool refused | tool={tool_name} reason={exc}")
        raise HTTPException(status_code=400, detail=str(exc))
    except TypeError as exc:
        # Wrong or missing arguments for the tool's schema.
        raise HTTPException(status_code=400, detail=f"Invalid arguments for {tool_name}: {exc}")

    return {"success": True, "tool": tool_name, "result": result}
