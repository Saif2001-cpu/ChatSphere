from pydantic_settings import BaseSettings
from pydantic import AnyUrl, field_validator
from functools import lru_cache
from dotenv import load_dotenv
import os
import secrets

load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "Chat App Backend"
    MONGO_URI: AnyUrl = os.getenv("MONGO_URI")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))
    
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET")
    
    # Environment indicator for CORS and security settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")

    @field_validator('JWT_SECRET_KEY')
    @classmethod
    def validate_jwt_secret(cls, v):
        if not v:
            # Generate a secure random secret if none provided (for development only)
            if os.getenv("ENVIRONMENT") != "development":
                raise ValueError("JWT_SECRET_KEY must be set in production")
            return secrets.token_urlsafe(32)
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
