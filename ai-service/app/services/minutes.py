"""Minutes of a meeting, written from its transcript.

The transcript is the evidence. Attached documents only help with names and
terms. Every decision and action item must be supported by the transcript, and
owners and due dates are kept only when the transcript states them.
"""

from __future__ import annotations

import json
import logging
import re

from app.core.config import settings
from app.guardrails.grounding import _content_tokens, check_grounding, split_sentences
from app.prompts.audience import with_audience
from app.prompts.minutes_prompt import build_merge_prompt, build_minutes_prompt
from app.services.llm_service import generate_answer

logger = logging.getLogger(__name__)

MINUTES_PART_CHARS = 48_000  # about 12k tokens per request
LIST_FIELDS = ("key_concepts", "important_points", "decisions", "open_questions")
_WINDOW_CHARS = 1500


def split_transcript(text: str, max_chars: int | None = None) -> list[str]:
    limit = max_chars or MINUTES_PART_CHARS
    parts: list[str] = []
    current: list[str] = []
    size = 0
    for line in text.split("\n"):
        while len(line) > limit:  # one giant line, e.g. pasted notes without breaks
            if current:
                parts.append("\n".join(current))
                current, size = [], 0
            parts.append(line[:limit])
            line = line[limit:]
        if current and size + len(line) + 1 > limit:
            parts.append("\n".join(current))
            current, size = [], 0
        current.append(line)
        size += len(line) + 1
    if current:
        parts.append("\n".join(current))
    return [p for p in parts if p.strip()]


def _background_chunks(group_id: int | None, resource_ids: list[int] | None) -> list[str]:
    if not group_id or not resource_ids:
        return []
    try:
        from app.embeddings.embedding_service import generate_embeddings
        from app.vectorstore.faiss_store import search_index

        query = generate_embeddings(["key terms, names, topics"])[0]
        hits = search_index(group_id=group_id, query_embedding=query, top_k=5, threshold=0.0, resource_ids=resource_ids)
        return [h["content"] for h in hits]
    except Exception as exc:  # documents are optional context; the transcript is enough
        logger.warning(f"Minutes background retrieval skipped: {exc}")
        return []


def _parse(answer: str) -> dict:
    clean = answer.strip()
    for fence in ("```json", "```"):
        if clean.startswith(fence):
            clean = clean[len(fence):]
    if clean.endswith("```"):
        clean = clean[:-3]
    parsed = json.loads(clean.strip())
    if not isinstance(parsed, dict):
        raise ValueError("Minutes must be a JSON object")
    return parsed


def _ask(prompt: str) -> dict:
    for attempt in range(2):
        try:
            return _parse(generate_answer(prompt))
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(f"Minutes JSON parse failed (attempt {attempt + 1}): {exc}")
    raise ValueError("The model returned minutes that could not be read.")


def _normalise(raw: dict) -> dict:
    out = {"executive_summary": str(raw.get("executive_summary") or "").strip()}
    for field in LIST_FIELDS:
        out[field] = [str(x).strip() for x in (raw.get(field) or []) if str(x).strip()]
    items = []
    for item in raw.get("action_items") or []:
        if isinstance(item, dict):
            task = str(item.get("task") or item.get("title") or "").strip()
            owner = str(item.get("owner") or "").strip()
            due = str(item.get("due") or "").strip()
        else:
            task, owner, due = str(item).strip(), "", ""
        if task:
            items.append({"task": task, "owner": owner, "due": due})
    out["action_items"] = items
    return out


def _windows(text: str) -> list[str]:
    lines = [line for line in text.split("\n") if line.strip()]
    windows, start = [], 0
    while start < len(lines):
        end, length = start, 0
        while end < len(lines) and (length == 0 or length + len(lines[end]) <= _WINDOW_CHARS):
            length += len(lines[end]) + 1
            end += 1
        windows.append("\n".join(lines[start:end]))
        if end >= len(lines):
            break
        start = max(start + 1, (start + end) // 2)
    return windows


def _supported(text: str, windows: list[str], transcript_tokens: set[str]) -> bool:
    result = check_grounding(text, windows)
    if result.checked_sentences:
        return result.grounded
    words = _content_tokens(text)  # too short for the sentence check: every word must occur
    return bool(words) and words <= transcript_tokens


def _named_in(value: str, lowered_transcript: str) -> bool:
    parts = [p for p in re.findall(r"[a-z0-9]+", value.lower()) if len(p) > 1]
    return bool(parts) and all(re.search(rf"\b{re.escape(p)}\b", lowered_transcript) for p in parts)


def ground_minutes(minutes: dict, transcript: str) -> dict:
    windows = _windows(transcript)
    tokens = _content_tokens(transcript)
    lowered = transcript.lower()
    minutes["executive_summary"] = " ".join(
        sentence for sentence in split_sentences(minutes["executive_summary"])
        if _supported(sentence, windows, tokens)
    )
    for field in LIST_FIELDS:
        minutes[field] = [item for item in minutes[field] if _supported(item, windows, tokens)]
    kept = []
    for item in minutes["action_items"]:
        if not _supported(item["task"], windows, tokens):
            continue
        owner = item["owner"] if item["owner"] and _named_in(item["owner"], lowered) else ""
        due = item["due"] if item["due"] and item["due"].lower() in lowered else ""
        kept.append({"task": item["task"], "owner": owner, "due": due})
    minutes["action_items"] = kept
    return minutes


def generate_minutes(
    transcript: str,
    source: str,
    audience: str = "student",
    group_id: int | None = None,
    resource_ids: list[int] | None = None,
) -> dict:
    parts = split_transcript(transcript or "")
    if not parts:
        raise ValueError("The transcript is empty.")
    background = _background_chunks(group_id, resource_ids)
    if len(parts) == 1:
        raw = _ask(with_audience(build_minutes_prompt(parts[0], background, source), audience))
    else:
        partials = [_ask(with_audience(build_minutes_prompt(p, background, source), audience)) for p in parts]
        raw = _ask(with_audience(build_merge_prompt([json.dumps(p) for p in partials]), audience))
    minutes = ground_minutes(_normalise(raw), transcript)
    minutes["model"] = settings.GROQ_MODEL
    return minutes
