"""PII masking.

Applied to every string that is about to be placed in a prompt - both the
user's message and the chunks retrieved from their uploaded PDFs, since scanned
notes routinely carry phone numbers and ID numbers.

Order matters: the 12-digit Aadhaar pattern is applied before the 10-digit
phone pattern so a longer identifier is never chopped into a phone match.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

PHONE_TOKEN = "[PHONE]"
EMAIL_TOKEN = "[EMAIL]"
ID_TOKEN = "[ID]"

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

# Aadhaar: 12 digits, optionally grouped 4-4-4 by spaces or hyphens.
_AADHAAR_RE = re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)")

# Indian mobile: 10 digits starting 6-9, with an optional +91 or 0 prefix.
_PHONE_RE = re.compile(r"(?<![\d@])(?:\+91[\s-]?|0)?[6-9]\d{9}(?![\d])")


@dataclass
class MaskResult:
    text: str
    counts: dict[str, int] = field(default_factory=dict)

    @property
    def masked(self) -> bool:
        return any(self.counts.values())


def mask_pii(text: str) -> MaskResult:
    """Replace PII with stable tokens. Returns the text plus per-type counts."""
    if not text:
        return MaskResult(text=text or "", counts={})

    counts = {"email": 0, "id": 0, "phone": 0}

    def _sub(pattern: re.Pattern[str], token: str, key: str, value: str) -> str:
        new_value, n = pattern.subn(token, value)
        counts[key] += n
        return new_value

    result = _sub(_EMAIL_RE, EMAIL_TOKEN, "email", text)
    result = _sub(_AADHAAR_RE, ID_TOKEN, "id", result)
    result = _sub(_PHONE_RE, PHONE_TOKEN, "phone", result)

    if any(counts.values()):
        # Log that masking happened - never log the values themselves.
        logger.info(
            "PII masked before LLM call | "
            f"emails={counts['email']} ids={counts['id']} phones={counts['phone']}"
        )

    return MaskResult(text=result, counts=counts)


def mask_all(texts: list[str]) -> tuple[list[str], dict[str, int]]:
    """Mask a list of strings, returning the masked list and combined counts."""
    totals = {"email": 0, "id": 0, "phone": 0}
    masked: list[str] = []
    for text in texts:
        result = mask_pii(text)
        masked.append(result.text)
        for key, value in result.counts.items():
            totals[key] += value
    return masked, totals
