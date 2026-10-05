"""Grounding check for RAG answers.

After the RAGAgent replies, every substantive sentence of the answer must be
supported by a retrieved chunk. Support is either a direct substring match or
enough token overlap with a single chunk. If any sentence is unsupported, the
answer is replaced rather than shown - one sourced claim must not lend its
citations to an invented one.

This is a cheap lexical check on purpose: it runs on every response, needs no
model call, and is deterministic in tests.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

UNSUPPORTED_MESSAGE = "I could not find support for this in your notes."

# Overlap required between a sentence's content words and one chunk.
DEFAULT_THRESHOLD = 0.5

# Sentences shorter than this are ignored - "Yes." cannot be meaningfully checked.
MIN_CONTENT_TOKENS = 3

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+|\n+")
_TOKEN_RE = re.compile(r"[a-z0-9]+")

_STOPWORDS = frozenset(
    """
    a an the and or but if then than that this these those of in on at to for from by with without
    is are was were be been being am do does did doing have has had having it its as not no nor so
    such can could should would may might must will shall about into over under between each which
    who whom what when where why how there here you your we our they their he she his her i me my
    """.split()
)


def _normalise(token: str) -> str:
    """Fold a simple English plural so "slice" and "slices" match.

    Deliberately crude - a real stemmer would be another dependency for a check
    that only needs to know whether two texts talk about the same things.
    """
    if len(token) > 3 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 3 and token.endswith("es") and not token.endswith("ses"):
        return token[:-2]
    if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def _content_tokens(text: str) -> set[str]:
    return {
        _normalise(token)
        for token in _TOKEN_RE.findall(text.lower())
        if token not in _STOPWORDS
    }


def split_sentences(text: str) -> list[str]:
    return [sentence.strip() for sentence in _SENTENCE_SPLIT_RE.split(text or "") if sentence.strip()]


@dataclass(frozen=True)
class GroundingResult:
    grounded: bool
    supported_sentences: int
    checked_sentences: int
    best_overlap: float

    @property
    def ratio(self) -> float:
        if not self.checked_sentences:
            return 0.0
        return self.supported_sentences / self.checked_sentences


def check_grounding(
    answer: str,
    chunks: list[str],
    threshold: float = DEFAULT_THRESHOLD,
) -> GroundingResult:
    """Verify at least one answer sentence is supported by a chunk."""
    if not answer or not chunks:
        return GroundingResult(False, 0, 0, 0.0)

    lowered_chunks = [chunk.lower() for chunk in chunks]
    chunk_tokens = [_content_tokens(chunk) for chunk in chunks]

    supported = 0
    checked = 0
    best_overlap = 0.0

    for sentence in split_sentences(answer):
        tokens = _content_tokens(sentence)
        if len(tokens) < MIN_CONTENT_TOKENS:
            continue
        checked += 1

        lowered = sentence.lower()
        if any(lowered in chunk for chunk in lowered_chunks):
            supported += 1
            best_overlap = 1.0
            continue

        overlap = max((len(tokens & chunk) / len(tokens) for chunk in chunk_tokens), default=0.0)
        best_overlap = max(best_overlap, overlap)
        if overlap >= threshold:
            supported += 1

    return GroundingResult(
        grounded=checked > 0 and supported == checked,
        supported_sentences=supported,
        checked_sentences=checked,
        best_overlap=best_overlap,
    )


def enforce_grounding(
    answer: str,
    chunks: list[str],
    threshold: float = DEFAULT_THRESHOLD,
    exempt: tuple[str, ...] = (),
) -> tuple[str, GroundingResult]:
    """Return the answer, or the replacement message when it is unsupported.

    `exempt` holds answers that are not claims about the notes (the
    "not in your notes" reply, a clarifying question) and so are passed through.
    """
    result = check_grounding(answer, chunks, threshold)

    if answer in exempt:
        return answer, result
    # Nothing was checkable (e.g. a one-word answer): leave it alone.
    if result.checked_sentences == 0:
        return answer, result
    if result.grounded:
        return answer, result

    logger.warning(
        "Grounding check failed - answer replaced | "
        f"sentences={result.checked_sentences} best_overlap={result.best_overlap:.2f}"
    )
    return UNSUPPORTED_MESSAGE, result


def keep_grounded_sentences(
    answer: str,
    chunks: list[str],
    threshold: float = DEFAULT_THRESHOLD,
    exempt: tuple[str, ...] = (),
) -> tuple[str, GroundingResult]:
    """Drop unsupported sentences while preserving independently grounded claims."""
    if answer in exempt:
        return answer, check_grounding(answer, chunks, threshold)
    if not answer or not chunks:
        return UNSUPPORTED_MESSAGE, check_grounding(answer, chunks, threshold)

    all_chunk_tokens = set().union(*(_content_tokens(chunk) for chunk in chunks))
    kept: list[str] = []
    for sentence in split_sentences(answer):
        tokens = _content_tokens(sentence)
        if len(tokens) < MIN_CONTENT_TOKENS:
            if tokens and tokens <= all_chunk_tokens:
                kept.append(sentence)
            continue
        if check_grounding(sentence, chunks, threshold).grounded:
            kept.append(sentence)

    if not kept:
        result = check_grounding(answer, chunks, threshold)
        if result.checked_sentences == 0:
            return answer, result
        return UNSUPPORTED_MESSAGE, result
    grounded_answer = " ".join(kept)
    return grounded_answer, check_grounding(grounded_answer, chunks, threshold)
