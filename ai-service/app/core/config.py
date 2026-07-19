from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "StudyFlow AI Service"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    AI_STORAGE_DIR: str = "/app/ai-storage"
    STUDY_SERVICE_URL: str = "http://study-service:8000"
    
    # LLM Settings
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_USER: str = "studyflow"
    DB_PASSWORD: str
    DB_NAME: str = os.getenv("DB_NAME", "studyflow")
    
    @property
    def DATABASE_URL(self) -> str:
        from urllib.parse import quote_plus
        password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        return f"postgresql://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Internal service-to-service authentication key
    INTERNAL_API_KEY: str

    # Storage
    STORAGE_BACKEND: str = "local" # 'local' or 's3'
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str | None = None
    UPLOAD_PATH: str = "/app/uploads"

    class Config:
        env_file = ".env"

settings = Settings()
