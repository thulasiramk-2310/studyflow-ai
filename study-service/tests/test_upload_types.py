"""Uploads accept exactly the types indexing can read, with the MIME types browsers really send."""

from __future__ import annotations

import pytest

from app.api.endpoints.resources import is_allowed_upload


@pytest.mark.parametrize("filename, content_type", [
    ("notes.pdf", "application/pdf"),
    ("notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ("slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
    ("notes.md", "text/markdown"),
    ("notes.md", "text/plain"),
    ("notes.md", ""),            # Windows browsers often send no type for .md
    ("notes.txt", "text/plain"),
    ("NOTES.PDF", "application/pdf"),
])
def test_supported_files_are_accepted(filename, content_type):
    assert is_allowed_upload(filename, content_type)


@pytest.mark.parametrize("filename, content_type", [
    ("program.exe", "application/octet-stream"),
    ("notes.pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),  # mismatch
    ("image.png", "image/png"),
    ("notes", "application/pdf"),
])
def test_other_files_are_rejected(filename, content_type):
    assert not is_allowed_upload(filename, content_type)
