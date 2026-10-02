"""FAISS indexes shared through S3 between replicas.

Each replica has its own local copy. Uploads are immutable versioned snapshots
plus a `current.json` pointer, so readers notice new versions and never mix
files from two versions; writers refresh to the latest snapshot before adding.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np
import pytest

from app.core.config import settings
from app.services import s3_sync
from app.vectorstore import faiss_store


class FakeS3:
    def __init__(self):
        self.objects: dict[str, bytes] = {}

    def upload_file(self, filename, bucket, key):
        self.objects[key] = Path(filename).read_bytes()

    def download_file(self, bucket, key, filename):
        if key not in self.objects:
            raise s3_sync.ClientError({"Error": {"Code": "404"}}, "GetObject")
        Path(filename).write_bytes(self.objects[key])

    def put_object(self, Bucket, Key, Body):
        self.objects[Key] = Body if isinstance(Body, bytes) else Body.encode()

    def get_object(self, Bucket, Key):
        if Key not in self.objects:
            raise s3_sync.ClientError({"Error": {"Code": "NoSuchKey"}}, "GetObject")
        body = self.objects[Key]
        return {"Body": type("B", (), {"read": lambda self_: body})()}

    def list_objects_v2(self, Bucket, Prefix, ContinuationToken=None):
        keys = sorted(k for k in self.objects if k.startswith(Prefix))
        start = int(ContinuationToken or 0)
        page = keys[start : start + 1000]
        response = {"Contents": [{"Key": k} for k in page]} if page else {}
        if start + len(page) < len(keys):
            response.update(IsTruncated=True, NextContinuationToken=str(start + len(page)))
        return response

    def delete_objects(self, Bucket, Delete):
        for obj in Delete["Objects"]:
            self.objects.pop(obj["Key"], None)


@pytest.fixture
def s3(monkeypatch):
    fake = FakeS3()
    monkeypatch.setattr(s3_sync, "get_s3_client", lambda: fake)
    monkeypatch.setattr(settings, "AWS_S3_BUCKET", "test-bucket")
    return fake


class Replica:
    """One AI-service replica: its own local storage directory."""

    def __init__(self, root: Path, monkeypatch):
        self.root = root
        self.monkeypatch = monkeypatch

    def __enter__(self):
        self._prev = settings.AI_STORAGE_DIR
        settings.AI_STORAGE_DIR = str(self.root)
        return self

    def __exit__(self, *exc):
        settings.AI_STORAGE_DIR = self._prev

    def add(self, resource_id: int, n: int = 3):
        v = np.random.default_rng(resource_id).random((n, 8)).astype("float32")
        v /= np.linalg.norm(v, axis=1, keepdims=True)
        chunks = [{"page_num": 1, "text": f"r{resource_id} chunk {i}"} for i in range(n)]
        faiss_store.add_to_index(1, resource_id, f"r{resource_id}.pdf", chunks, v)

    def local_resources(self) -> set[int]:
        group_dir = faiss_store.get_group_dir(1)
        s3_sync.sync_group_index_from_s3(1, group_dir)
        return {d["resource_id"] for d in faiss_store.load_documents(group_dir)}


def test_a_reader_picks_up_a_newer_version(tmp_path, s3, monkeypatch):
    a, b = Replica(tmp_path / "a", monkeypatch), Replica(tmp_path / "b", monkeypatch)
    with a:
        a.add(1)
    with b:
        assert b.local_resources() == {1}
    with a:
        a.add(2)
    with b:
        # Before: B had a local index, so it never looked at S3 again.
        assert b.local_resources() == {1, 2}


def test_a_stale_writer_does_not_drop_another_replicas_chunks(tmp_path, s3, monkeypatch):
    a, b = Replica(tmp_path / "a", monkeypatch), Replica(tmp_path / "b", monkeypatch)
    with a:
        a.add(1)
    with b:
        b.local_resources()  # B now holds version 1
    with a:
        a.add(2)  # S3 moves to version 2; B's copy is stale
    with b:
        b.add(3)  # must build on version 2, not on its stale copy
    with a:
        assert a.local_resources() == {1, 2, 3}


def test_uploads_are_immutable_snapshots_behind_a_pointer(tmp_path, s3, monkeypatch):
    with Replica(tmp_path / "a", monkeypatch) as a:
        a.add(1)
        a.add(2)

    pointer = json.loads(s3.objects["faiss_indexes/group-1/current.json"])
    version = pointer["version"]
    assert f"faiss_indexes/group-1/{version}/index.faiss" in s3.objects
    assert f"faiss_indexes/group-1/{version}/documents.json" in s3.objects


def test_an_index_uploaded_in_the_old_flat_layout_still_loads(tmp_path, s3, monkeypatch):
    docs = [{"vector_id": 0, "resource_id": 9, "filename": "old.pdf", "page": 1, "text": "legacy"}]
    s3.objects["faiss_indexes/group-1/documents.json"] = json.dumps(docs).encode()
    s3.objects["faiss_indexes/group-1/metadata.json"] = b"{}"

    with Replica(tmp_path / "b", monkeypatch) as b:
        assert b.local_resources() == {9}


def test_incomplete_remote_snapshot_does_not_replace_local_files(tmp_path, s3, monkeypatch):
    local_dir = tmp_path / "group-1"
    local_dir.mkdir()
    (local_dir / "index.faiss").write_bytes(b"last-known-good")
    (local_dir / s3_sync.LOCAL_VERSION_FILE).write_text("old-version")
    s3.objects["faiss_indexes/group-1/current.json"] = b'{"version":"broken"}'
    s3.objects["faiss_indexes/group-1/broken/documents.json"] = b"[]"

    with pytest.raises(s3_sync.ClientError):
        s3_sync.sync_group_index_from_s3(1, local_dir, strict=True)

    assert (local_dir / "index.faiss").read_bytes() == b"last-known-good"
    assert (local_dir / s3_sync.LOCAL_VERSION_FILE).read_text() == "old-version"


def test_snapshot_pruning_handles_more_than_one_s3_page(s3):
    prefix = "faiss_indexes/group-1/"
    s3.objects.update({f"{prefix}old-{i}/index.faiss": b"old" for i in range(1001)})
    s3.objects[f"{prefix}current.json"] = b'{"version":"new"}'
    s3.objects[f"{prefix}new/index.faiss"] = b"new"

    s3_sync._prune_old_versions(s3, "test-bucket", prefix, keep={"new"})

    assert set(s3.objects) == {
        f"{prefix}current.json",
        f"{prefix}new/index.faiss",
    }
