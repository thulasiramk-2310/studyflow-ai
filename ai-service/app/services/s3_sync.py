"""Share each group's FAISS index between replicas through S3.

Layout:
    faiss_indexes/group-<id>/<version>/{index.faiss,metadata.json,documents.json}
    faiss_indexes/group-<id>/current.json   -> {"version": "<version>"}

Every upload is a new immutable snapshot; the pointer is swapped last. A reader
fetches the small pointer and downloads only when its local copy is a different
version, and always downloads one snapshot, so it never mixes files from two
writes. Writers hold a per-group lock (see faiss_store) and refresh to the
current snapshot before adding, so no replica overwrites another's chunks.
"""

import json
import logging
import os
import uuid
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

INDEX_FILES = ("index.faiss", "metadata.json", "documents.json")
LOCAL_VERSION_FILE = ".s3-version"


def get_s3_client():
    if not settings.STORAGE_BACKEND or settings.STORAGE_BACKEND.lower() != 's3':
        return None
    return boto3.client('s3', region_name=settings.AWS_REGION)


def _prefix(group_id: int) -> str:
    return f"faiss_indexes/group-{group_id}/"


def _local_version(local_dir: Path) -> Optional[str]:
    path = local_dir / LOCAL_VERSION_FILE
    return path.read_text().strip() if path.exists() else None


def _set_local_version(local_dir: Path, version: str) -> None:
    tmp = local_dir / (LOCAL_VERSION_FILE + ".tmp")
    tmp.write_text(version)
    os.replace(tmp, local_dir / LOCAL_VERSION_FILE)


def _remote_version(s3, bucket: str, group_id: int, strict: bool = False) -> Optional[str]:
    try:
        body = s3.get_object(Bucket=bucket, Key=_prefix(group_id) + "current.json")["Body"].read()
        return json.loads(body)["version"]
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404", "NotFound"):
            return None
        if strict:
            raise
        logger.error("Unable to read FAISS snapshot pointer for group %s", group_id)
        return None


def sync_group_index_from_s3(group_id: int, local_dir: Path, *, strict: bool = False):
    """Bring the local copy up to the version S3 currently points at."""
    s3 = get_s3_client()
    if not s3 or not settings.AWS_S3_BUCKET:
        return
    bucket = settings.AWS_S3_BUCKET

    version = _remote_version(s3, bucket, group_id, strict=strict)
    if version is None:
        # No pointer: either nothing published, or an index uploaded in the old
        # flat layout. Load the latter once; the next write republishes it versioned.
        if (local_dir / "index.faiss").exists() or (local_dir / "documents.json").exists():
            return
        legacy = s3.list_objects_v2(Bucket=bucket, Prefix=_prefix(group_id)).get("Contents", [])
        if not any(obj["Key"] in {_prefix(group_id) + name for name in INDEX_FILES} for obj in legacy):
            return
        version, source = "legacy", _prefix(group_id)
    else:
        source = f"{_prefix(group_id)}{version}/"
    if _local_version(local_dir) == version:
        return

    os.makedirs(local_dir, exist_ok=True)
    try:
        # Download the whole snapshot first, then swap each file into place.
        staged = []
        for filename in INDEX_FILES:
            tmp = local_dir / (filename + ".download")
            try:
                s3.download_file(bucket, f"{source}{filename}", str(tmp))
                staged.append((tmp, local_dir / filename))
            except ClientError as exc:
                if version != "legacy" and (filename in ("index.faiss", "documents.json") or strict):
                    raise exc
        for tmp, final in staged:
            os.replace(tmp, final)
        _set_local_version(local_dir, version)
        logger.info(f"Synced FAISS index for group {group_id} to version {version}")
    except ClientError as e:
        if strict:
            raise
        logger.error(f"Error syncing from S3: {e}")


def sync_group_index_to_s3(group_id: int, local_dir: Path, *, strict: bool = False):
    """Publish the local copy as a new immutable snapshot and point readers at it."""
    s3 = get_s3_client()
    if not s3 or not settings.AWS_S3_BUCKET:
        return
    bucket = settings.AWS_S3_BUCKET
    prefix = _prefix(group_id)
    previous = _remote_version(s3, bucket, group_id, strict=strict)
    version = uuid.uuid4().hex

    try:
        for filename in INDEX_FILES:
            local_path = local_dir / filename
            if local_path.exists():
                s3.upload_file(str(local_path), bucket, f"{prefix}{version}/{filename}")
            elif strict and filename in ("index.faiss", "documents.json"):
                raise FileNotFoundError(f"Required FAISS snapshot file is missing: {filename}")
        s3.put_object(Bucket=bucket, Key=prefix + "current.json", Body=json.dumps({"version": version}))
        _set_local_version(local_dir, version)
        logger.info(f"Published FAISS index for group {group_id} as version {version}")
        _prune_old_versions(s3, bucket, prefix, keep={version, previous})
    except ClientError as e:
        if strict:
            raise
        logger.error(f"Error syncing to S3: {e}")


def _prune_old_versions(s3, bucket: str, prefix: str, keep: set) -> None:
    """Delete snapshots older than the previous one (a reader may still be fetching that)."""
    continuation_token = None
    stale = []
    while True:
        params = {"Bucket": bucket, "Prefix": prefix}
        if continuation_token:
            params["ContinuationToken"] = continuation_token
        response = s3.list_objects_v2(**params)
        for obj in response.get("Contents", []):
            key = obj["Key"]
            version = key[len(prefix):].split("/", 1)[0]
            if key != prefix + "current.json" and version not in keep:
                stale.append({"Key": key})

        if not response.get("IsTruncated"):
            break
        continuation_token = response["NextContinuationToken"]

    for offset in range(0, len(stale), 1000):
        s3.delete_objects(Bucket=bucket, Delete={"Objects": stale[offset : offset + 1000]})
