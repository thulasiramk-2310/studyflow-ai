from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Study Service"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # JWT
    JWT_SECRET: Optional[str] = None
    JWT_ALGORITHM: str = "HS512"

    # AI Service Integration
    AI_SERVICE_URL: str = "http://ai-service:8002"
    
    # Internal service-to-service authentication key
    INTERNAL_API_KEY: str = "dev_internal_key_change_me"
    
    MAX_FILE_SIZE: int = 25 * 1024 * 1024
    UPLOAD_PATH: str = "uploads"
    
    # Storage
    STORAGE_BACKEND: str = "local" # 'local' or 's3'
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
