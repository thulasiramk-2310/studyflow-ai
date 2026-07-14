from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "StudyFlow AI Service"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    AI_STORAGE_DIR: str = "/app/ai-storage"
    STUDY_SERVICE_URL: str = "http://study-service:8000"
    
    # LLM Settings
    OLLAMA_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL: str = "qwen3:8b"

    # Database
    DATABASE_URL: str

    # Internal service-to-service authentication key
    INTERNAL_API_KEY: str = "dev_internal_key_change_me"

    # Storage
    STORAGE_BACKEND: str = "local" # 'local' or 's3'
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str | None = None
    UPLOAD_PATH: str = "/app/uploads"

    class Config:
        env_file = ".env"

settings = Settings()
