from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Service"
    API_V1_STR: str = "/api/v1"
    
    # AI Specific Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    LLM_MODEL: str = "qwen3:8b"
    FAISS_INDEX_PATH: str = "./faiss_index"

    class Config:
        env_file = "../../.env"

settings = Settings()
