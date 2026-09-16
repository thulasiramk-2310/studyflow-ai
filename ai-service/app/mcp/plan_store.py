"""Process-local store for plans created through the MCP tools.

The SchedulerAgent is stateless by design - study-service owns plan persistence
and no table was added to ai_db. `create_study_plan` therefore keeps its result
here so `get_study_plan` has something to return within the same process.

This is NOT durable: it is lost on restart and not shared between ECS tasks.
Durable retrieval needs an internal read endpoint on study-service, which
crosses a service boundary and is deliberately out of scope here.
"""

from __future__ import annotations

import logging
from threading import Lock
from typing import Any, Optional

logger = logging.getLogger(__name__)

_plans: dict[tuple[int, int], dict[str, Any]] = {}
_lock = Lock()


def save_plan(group_id: int, user_id: int, plan: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        _plans[(group_id, user_id)] = plan
    logger.info(f"Stored study plan in process cache | group={group_id} user={user_id}")
    return plan


def get_plan(group_id: int, user_id: int) -> Optional[dict[str, Any]]:
    with _lock:
        return _plans.get((group_id, user_id))


def clear() -> None:
    with _lock:
        _plans.clear()
