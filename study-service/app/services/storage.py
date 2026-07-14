import abc
import os
import shutil
import boto3
from botocore.exceptions import ClientError
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService(abc.ABC):
    @abc.abstractmethod
    def upload(self, key: str, content: bytes, content_type: str, metadata: dict = None) -> str:
        """Uploads a file and returns the key."""
        pass
        
    @abc.abstractmethod
    def download_to_file(self, key: str, local_path: str):
        """Downloads a file to a local path."""
        pass
        
    @abc.abstractmethod
    def delete(self, key: str):
        """Deletes a file (should be idempotent)."""
        pass
        
    @abc.abstractmethod
    def exists(self, key: str) -> bool:
        """Checks if a file exists."""
        pass
        
    @abc.abstractmethod
    def get_download_url(self, key: str) -> str:
        """Gets a presigned URL (S3) or local path (Local)."""
        pass

class LocalStorageService(StorageService):
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)
        
    def _get_abs_path(self, key: str) -> str:
        return os.path.join(self.base_path, key)
        
    def upload(self, key: str, content: bytes, content_type: str, metadata: dict = None) -> str:
        abs_path = self._get_abs_path(key)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "wb") as f:
            f.write(content)
        return key
        
    def download_to_file(self, key: str, local_path: str):
        abs_path = self._get_abs_path(key)
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"File {key} not found locally.")
        shutil.copy2(abs_path, local_path)
        
    def delete(self, key: str):
        abs_path = self._get_abs_path(key)
        if os.path.exists(abs_path):
            os.remove(abs_path)
            
    def exists(self, key: str) -> bool:
        return os.path.exists(self._get_abs_path(key))
        
    def get_download_url(self, key: str) -> str:
        """Returns the absolute path to be served via FileResponse."""
        return self._get_abs_path(key)

class S3StorageService(StorageService):
    def __init__(self, bucket: str, region: str):
        self.bucket = bucket
        self.region = region
        self.s3_client = boto3.client("s3", region_name=region)
        
    def upload(self, key: str, content: bytes, content_type: str, metadata: dict = None) -> str:
        extra_args = {"ContentType": content_type}
        if metadata:
            extra_args["Metadata"] = {k: str(v) for k, v in metadata.items()}
            
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content,
            **extra_args
        )
        return key
        
    def download_to_file(self, key: str, local_path: str):
        self.s3_client.download_file(self.bucket, key, local_path)
        
    def delete(self, key: str):
        self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            
    def exists(self, key: str) -> bool:
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise
            
    def get_download_url(self, key: str) -> str:
        url = self.s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=3600
        )
        return url

def get_storage_service() -> StorageService:
    if settings.STORAGE_BACKEND.lower() == "s3":
        if not settings.AWS_S3_BUCKET:
            raise ValueError("AWS_S3_BUCKET must be set when STORAGE_BACKEND is 's3'")
        return S3StorageService(
            bucket=settings.AWS_S3_BUCKET,
            region=settings.AWS_REGION
        )
    else:
        return LocalStorageService(base_path=settings.UPLOAD_PATH)

storage = get_storage_service()
