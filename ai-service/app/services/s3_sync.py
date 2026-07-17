import os
import boto3
from pathlib import Path
from botocore.exceptions import ClientError
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_s3_client():
    if not settings.STORAGE_BACKEND or settings.STORAGE_BACKEND.lower() != 's3':
        return None
    return boto3.client('s3', region_name=settings.AWS_REGION)

def sync_group_index_from_s3(group_id: int, local_dir: Path):
    """
    Downloads the FAISS index files from S3 to the local directory
    if they don't already exist locally.
    """
    s3 = get_s3_client()
    if not s3 or not settings.AWS_S3_BUCKET:
        return

    bucket = settings.AWS_S3_BUCKET
    prefix = f"faiss_indexes/group-{group_id}/"

    # If the index already exists locally, we assume it's up to date for this session
    if (local_dir / "index.faiss").exists():
        return

    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        if 'Contents' not in response:
            logger.info(f"No FAISS index found in S3 for group {group_id}")
            return

        os.makedirs(local_dir, exist_ok=True)
        for obj in response['Contents']:
            key = obj['Key']
            filename = key.replace(prefix, "")
            local_path = local_dir / filename
            s3.download_file(bucket, key, str(local_path))
            logger.info(f"Downloaded {filename} from S3 for group {group_id}")
    except ClientError as e:
        logger.error(f"Error syncing from S3: {e}")

def sync_group_index_to_s3(group_id: int, local_dir: Path):
    """
    Uploads the FAISS index files from the local directory to S3.
    This should be called asynchronously after a successful indexing operation.
    """
    s3 = get_s3_client()
    if not s3 or not settings.AWS_S3_BUCKET:
        return

    bucket = settings.AWS_S3_BUCKET
    prefix = f"faiss_indexes/group-{group_id}/"

    try:
        for filename in ["index.faiss", "metadata.json", "documents.json"]:
            local_path = local_dir / filename
            if local_path.exists():
                s3_key = prefix + filename
                s3.upload_file(str(local_path), bucket, s3_key)
                logger.info(f"Uploaded {filename} to S3 for group {group_id}")
    except ClientError as e:
        logger.error(f"Error syncing to S3: {e}")
