"""Turn exported meeting transcripts into plain `Speaker: text` lines.

Google Meet, Zoom and Teams export .vtt, .txt or .docx. Timestamps, cue ids and
markup are noise for the minutes prompt. Speaker names are kept: they are how
minutes learn who committed to an action.
"""

from __future__ import annotations

import io
import os
import re

TRANSCRIPT_EXTENSIONS = (".vtt", ".txt", ".docx")

_BLOCK_SPLIT = re.compile(r"\n\s*\n")
_VOICE = re.compile(r"<v(?:\.[^ >]*)?\s+([^>]+)>")
_TAG = re.compile(r"</?[^>]+>")
_SPEAKER = re.compile(r"^([A-Z][\w .'-]{0,59}):\s+(.*)$")


def clean_vtt(text: str) -> str:
    text = text.lstrip("﻿").replace("\r\n", "\n").replace("\r", "\n")
    turns: list[list] = []  # [speaker or None, text]
    for block in _BLOCK_SPLIT.split(text):
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        timing = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if timing is None:
            continue  # WEBVTT header, NOTE, STYLE or REGION block
        block_speaker = None
        for line in lines[timing + 1:]:
            voice = _VOICE.search(line)
            if voice:
                block_speaker = voice.group(1).strip()
            body = _TAG.sub("", line).strip()
            if not body:
                continue
            speaker = block_speaker
            named = _SPEAKER.match(body)
            if speaker is None and named:
                speaker, body = named.group(1).strip(), named.group(2).strip()
            if turns and speaker is not None and turns[-1][0] == speaker:
                turns[-1][1] = f"{turns[-1][1]} {body}"
            else:
                turns.append([speaker, body])
    return "\n".join(f"{s}: {t}" if s else t for s, t in turns)


def _decode(data: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("latin-1")


def parse_transcript(filename: str, data: bytes) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in TRANSCRIPT_EXTENSIONS:
        raise ValueError("Upload a .vtt, .txt or .docx transcript.")
    if ext == ".docx":
        import docx

        try:
            document = docx.Document(io.BytesIO(data))
        except Exception as exc:
            raise ValueError("This Word file could not be read.") from exc
        text = "\n".join(p.text.strip() for p in document.paragraphs if p.text.strip())
    else:
        text = _decode(data)
        if ext == ".vtt" or text.lstrip("﻿").startswith("WEBVTT"):
            text = clean_vtt(text)
        else:
            text = "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"))
    text = text.strip()
    if not text:
        raise ValueError("The transcript is empty.")
    return text
