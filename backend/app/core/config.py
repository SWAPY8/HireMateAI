import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireMate AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-hiremate-ai-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hiremate.db")
    
    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # AI API key
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    BACKUP_AI_API_KEY: str = os.getenv("BACKUP_AI_API_KEY", "")
    CANDIDATE_AI_API_KEY: str = os.getenv("CANDIDATE_AI_API_KEY", "")
    
    class Config:
        case_sensitive = True


settings = Settings()
