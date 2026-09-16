"""Guardrails that wrap the agent graph.

Order on every request:

1. `check_injection` on the raw user message - reject with HTTP 400.
2. `mask_pii` on the message and on every retrieved chunk - before any text
   reaches the LLM.
3. `enforce_grounding` on the RAGAgent's answer - replace unsupported answers.

Steps 1 and 2 are input guardrails (`guard_input`); step 3 is an output
guardrail applied after the graph returns.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.guardrails.grounding import (
    UNSUPPORTED_MESSAGE,
    GroundingResult,
    check_grounding,
    enforce_grounding,
)
from app.guardrails.injection import (
    REJECTION_MESSAGE,
    InjectionResult,
    check_injection,
    is_injection,
)
from app.guardrails.pii import MaskResult, mask_all, mask_pii

logger = logging.getLogger(__name__)


class GuardrailViolation(Exception):
    """Raised when an input guardrail rejects a request."""

    def __init__(self, message: str = REJECTION_MESSAGE, rule: str | None = None):
        super().__init__(message)
        self.message = message
        self.rule = rule


@dataclass(frozen=True)
class GuardedInput:
    message: str
    pii_counts: dict[str, int]

    @property
    def pii_masked(self) -> bool:
        return any(self.pii_counts.values())


def guard_input(message: str) -> GuardedInput:
    """Run the input guardrails in order. Raises `GuardrailViolation` on reject."""
    verdict = check_injection(message)
    if verdict.blocked:
        raise GuardrailViolation(REJECTION_MESSAGE, rule=verdict.rule)

    masked = mask_pii(message)
    return GuardedInput(message=masked.text, pii_counts=masked.counts)


__all__ = [
    "GuardrailViolation",
    "GuardedInput",
    "guard_input",
    "check_injection",
    "is_injection",
    "InjectionResult",
    "REJECTION_MESSAGE",
    "mask_pii",
    "mask_all",
    "MaskResult",
    "check_grounding",
    "enforce_grounding",
    "GroundingResult",
    "UNSUPPORTED_MESSAGE",
]
