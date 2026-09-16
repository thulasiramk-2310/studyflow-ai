"""Prompt-injection detection for user messages.

Runs before anything reaches the agent graph. The goal is to catch attempts to
override the system prompt or impersonate the system, while never blocking a
genuine study question - a false positive silently breaks the product, so the
patterns are deliberately specific rather than broad.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

REJECTION_MESSAGE = (
    "This message looks like an attempt to change the assistant's instructions, so it was not "
    "processed. Ask about your study materials instead."
)

# Each entry is (rule name, compiled pattern). Names appear in logs and tests.
_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "override_instructions",
        re.compile(
            r"\b(?:ignore|disregard|forget|discard|override)\b[^.\n]{0,40}?"
            # "your" covers "forget your instructions", which carries no
            # positional scope word.
            r"\b(?:previous|prior|above|earlier|initial|original|all|your)\b[^.\n]{0,20}?"
            r"\b(?:instruction|instructions|prompt|prompts|rule|rules|direction|directions|context)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "identity_reassignment",
        re.compile(
            r"\byou\s+are\s+now\b|\bfrom\s+now\s+on\s+you\b|\bpretend\s+(?:to\s+be|you\s+are)\b"
            r"|\bact\s+as\s+(?:a\s+|an\s+|the\s+)?(?:system|admin|administrator|developer|dan|jailbroken)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "role_impersonation",
        # A fake role header at the start of a line: "SYSTEM:", "assistant:", etc.
        re.compile(r"(?im)^\s*(?:system|assistant|developer|admin)\s*:"),
    ),
    (
        "fake_delimiter",
        # Markdown-style fence used to simulate a new prompt section, or a
        # chat-template control token.
        re.compile(r"(?m)^\s*#{3,}|<\|(?:im_start|im_end|system|endoftext)\|>"),
    ),
    (
        "system_prompt_exfiltration",
        re.compile(
            r"\b(?:reveal|show|print|repeat|output|tell\s+me)\b[^.\n]{0,30}?"
            r"\b(?:your|the)\s+(?:system\s+prompt|initial\s+prompt|instructions|rules|configuration)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "restriction_bypass",
        re.compile(
            r"\b(?:developer\s+mode|jailbreak|do\s+anything\s+now|without\s+(?:any\s+)?restrictions"
            r"|bypass\s+(?:your\s+)?(?:rules|filters|restrictions|guardrails))\b",
            re.IGNORECASE,
        ),
    ),
)


@dataclass(frozen=True)
class InjectionResult:
    blocked: bool
    rule: str | None = None

    def __bool__(self) -> bool:  # truthy when the message is safe
        return not self.blocked


def check_injection(message: str) -> InjectionResult:
    """Return an `InjectionResult`; `blocked=True` means reject the request."""
    text = message or ""
    for name, pattern in _PATTERNS:
        if pattern.search(text):
            logger.warning(f"Guardrail blocked message | rule={name}")
            return InjectionResult(blocked=True, rule=name)
    return InjectionResult(blocked=False)


def is_injection(message: str) -> bool:
    return check_injection(message).blocked
