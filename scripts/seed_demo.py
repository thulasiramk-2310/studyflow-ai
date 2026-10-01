"""Create the public demo account, a study group and indexed sample notes.

Safe to run repeatedly: it only creates what is missing.

Usage: DEMO_PASSWORD=... python scripts/seed_demo.py --base-url https://studyflow-ai.duckdns.org
"""

from __future__ import annotations

import argparse
import http.cookiejar
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

DEMO_EMAIL = "demo@studyflow.ai"
DEMO_NAME = "Demo Student"
GROUP_NAME = "Operating Systems (Demo)"
NOTES_PATH = Path(__file__).resolve().parent.parent / "ai-service" / "evals" / "data" / "os_notes.pdf"


class _AllowPlainHttpPolicy(http.cookiejar.DefaultCookiePolicy):
    """The auth cookie is Secure. Also send it over plain HTTP so the script
    works against a local stack; it only ever talks to --base-url."""

    def return_ok_secure(self, cookie, request):
        return True


class Client:
    def __init__(self, base_url: str, insecure: bool):
        self.base_url = base_url.rstrip("/")
        context = ssl._create_unverified_context() if insecure else None
        jar = http.cookiejar.CookieJar(policy=_AllowPlainHttpPolicy())
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(jar),
            urllib.request.HTTPSHandler(context=context),
        )

    def request(self, method: str, path: str, body: bytes | None = None, content_type: str | None = None):
        req = urllib.request.Request(self.base_url + path, data=body, method=method)
        if content_type:
            req.add_header("Content-Type", content_type)
        try:
            with self.opener.open(req, timeout=60) as resp:
                raw = resp.read()
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw)
            except ValueError:
                return e.code, raw.decode(errors="replace")
        except urllib.error.URLError as e:
            fail(f"cannot reach {self.base_url}: {e.reason}")

    def json(self, method: str, path: str, payload: dict | None = None):
        body = json.dumps(payload).encode() if payload is not None else None
        return self.request(method, path, body, "application/json" if body else None)

    def upload(self, path: str, fields: dict, file_path: Path, mime: str):
        boundary = uuid.uuid4().hex
        parts = []
        for name, value in fields.items():
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
            f"Content-Type: {mime}\r\n\r\n".encode()
            + file_path.read_bytes()
            + b"\r\n"
        )
        parts.append(f"--{boundary}--\r\n".encode())
        return self.request("POST", path, b"".join(parts), f"multipart/form-data; boundary={boundary}")


def fail(message: str) -> None:
    print(f"seed: FAILED - {message}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--insecure", action="store_true", help="skip TLS verification (local Caddy)")
    args = parser.parse_args()

    password = os.environ.get("DEMO_PASSWORD")
    if not password:
        fail("DEMO_PASSWORD is not set")

    client = Client(args.base_url, args.insecure)
    created: list[str] = []

    status, _ = client.json("POST", "/auth/login", {"email": DEMO_EMAIL, "password": password})
    if status != 200:
        status, body = client.json("POST", "/auth/register", {"name": DEMO_NAME, "email": DEMO_EMAIL, "password": password})
        if status not in (200, 201):
            fail(f"register returned {status}: {body}")
        created.append("account")
        status, body = client.json("POST", "/auth/login", {"email": DEMO_EMAIL, "password": password})
        if status != 200:
            fail(f"login returned {status}: {body}")

    status, body = client.json("GET", "/api/v1/groups/")
    if status != 200:
        fail(f"list groups returned {status}: {body}")
    group = next((g for g in body["data"] if g["name"] == GROUP_NAME), None)
    if group is None:
        status, body = client.json(
            "POST",
            "/api/v1/groups/",
            {"name": GROUP_NAME, "description": "Sample group for the public demo.", "goal": "Revise OS fundamentals"},
        )
        if status != 201:
            fail(f"create group returned {status}: {body}")
        group = body["data"]
        created.append("group")
    group_id = group["id"]

    status, body = client.json("GET", f"/api/v1/resources/?group_id={group_id}")
    if status != 200:
        fail(f"list resources returned {status}: {body}")
    resource = next((r for r in body["data"] if r.get("status") != "FAILED"), None)
    if resource is None:
        status, body = client.upload("/api/v1/resources/upload", {"group_id": group_id}, NOTES_PATH, "application/pdf")
        if status != 201:
            fail(f"upload returned {status}: {body}")
        resource = body["data"]
        created.append("notes")

    deadline = time.time() + 300
    while resource.get("status") != "INDEXED":
        if resource.get("status") == "FAILED" or time.time() > deadline:
            fail(f"notes did not index (status {resource.get('status')})")
        time.sleep(5)
        status, body = client.json("GET", f"/api/v1/resources/{resource['id']}")
        if status != 200:
            fail(f"get resource returned {status}: {body}")
        resource = body["data"]

    print(f"seed: created {', '.join(created)}" if created else "seed: no changes")


if __name__ == "__main__":
    main()
