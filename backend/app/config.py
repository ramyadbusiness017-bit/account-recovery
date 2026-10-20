import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gonnit"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "gonnit-super-secret-key-recovery-system-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CHALLENGE_TIMEOUT_SECONDS: int = 600  # 10 minutes
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gonnit.db")
    
    # SMTP Email Configuration (Leave empty to use built-in Live Mailbox)
    SMTP_ENABLED: bool = False
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: str = "security@gonnit.com"
    SMTP_FROM_NAME: str = "Gonnit Account Security"
    
    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
