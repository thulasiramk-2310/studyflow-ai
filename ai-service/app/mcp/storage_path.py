"""Storage-root confinement for tool-supplied paths.

`index_notes` takes a path from an MCP client, which is untrusted input. Without
this check the tool is an arbitrary-file-read primitive: `../../etc/passwd` or
an absolute path would be handed straight to the loader.

Both storage backends use the same key shape (`groups/<id>/<uuid>.pdf`), so the
check normalises the key and verifies it stays under the configured root.
"""

from __future__ import annotations

import posixpath
import re

STORAGE_ROOT_ERROR = (
    "pdf_path must be a relative key inside the storage root "
    "(for example 'groups/1/file.pdf'); absolute paths and '..' are not allowed"
)

# Windows drive letters and UNC prefixes count as absolute too.
_WINDOWS_ABSOLUTE = re.compile(r"^(?:[A-Za-z]:|\\\\)")


class StoragePathError(ValueError):
    """Raised when a supplied path escapes, or tries to escape, the root."""


def resolve_storage_key(pdf_path: str) -> str:
    """Return a normalised storage key, or raise `StoragePathError`.

    Accepts only relative keys that stay inside the root after normalisation.
    """
    if not pdf_path or not pdf_path.strip():
        raise StoragePathError(STORAGE_ROOT_ERROR)

    candidate = pdf_path.strip().replace("\\", "/")

    if candidate.startswith("/") or _WINDOWS_ABSOLUTE.match(pdf_path.strip()):
        raise StoragePathError(STORAGE_ROOT_ERROR)

    # Reject anything with a parent-directory segment before normalisation, so
    # "a/../../b" cannot collapse into something that merely looks contained.
    if any(segment == ".." for segment in candidate.split("/")):
        raise StoragePathError(STORAGE_ROOT_ERROR)

    normalised = posixpath.normpath(candidate)

    if normalised.startswith(("..", "/")) or normalised == ".":
        raise StoragePathError(STORAGE_ROOT_ERROR)

    return normalised
