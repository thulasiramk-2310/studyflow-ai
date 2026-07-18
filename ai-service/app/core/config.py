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
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_USER: str = "studyflow"
    DB_PASSWORD: str = "studyflow"
    DB_NAME: str = os.getenv("DB_NAME", "studyflow")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

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
