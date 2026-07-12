from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Study Service"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # JWT
    JWT_SECRET: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"

    # AI Service Integration
    AI_SERVICE_URL: str = "http://ai-service:8002"
    
    MAX_FILE_SIZE: int = 25 * 1024 * 1024
    UPLOAD_PATH: str = "uploads"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
