import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"
    internal_service_secret: str = "internal_secret_key_change_in_production"
    express_api_base_url: str = "http://localhost:4000/api/v1"
    redis_url: str = "redis://localhost:6379"
    gemini_api_key: str = ""
    groq_api_key: str = ""
    aws_region: str = "us-east-1"
    s3_endpoint: str = "http://localhost:9000"
    aws_access_key_id: str = "minioadmin"
    aws_secret_access_key: str = "minioadmin"
    s3_bucket: str = "nextround-storage"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
