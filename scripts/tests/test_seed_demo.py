"""seed_demo.py must fail with a clear message, not a traceback, when the
server is unreachable (e.g. Caddy still obtaining its certificate)."""

from __future__ import annotations

import os
import socket
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "seed_demo.py"


def _closed_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def test_unreachable_server_fails_cleanly():
    env = {**os.environ, "DEMO_PASSWORD": "x"}
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--base-url", f"http://127.0.0.1:{_closed_port()}"],
        capture_output=True,
        text=True,
        env=env,
        timeout=60,
    )
    assert result.returncode == 1
    assert "Traceback" not in result.stderr
    assert "seed: FAILED - cannot reach" in result.stderr
