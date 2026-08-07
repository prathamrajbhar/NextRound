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
    upload_dir: str = os.getenv(
        "UPLOAD_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../api/uploads"))
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
