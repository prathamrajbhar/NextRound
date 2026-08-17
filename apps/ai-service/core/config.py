import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = Field(8000, validation_alias="AI_PORT")
    host: str = Field("0.0.0.0", validation_alias="AI_HOST")
    environment: str = Field("development", validation_alias="AI_ENVIRONMENT")
    internal_service_secret: str = "internal_secret_key_change_in_production"
    api_base_url: str = "http://localhost:4000/api/v1"
    redis_url: str = "redis://localhost:6379"
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    groq_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    groq_model: str = "llama-3.3-70b-versatile"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "nextround-storage"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

_DEFAULT_SECRETS = (
    "internal_secret_key_change_in_production",
    "super-secret-internal-service-key-for-ai-callbacks",
)
if settings.environment.lower() == "production" and settings.internal_service_secret in _DEFAULT_SECRETS:
    raise RuntimeError(
        "INTERNAL_SERVICE_SECRET is set to a known default value. Refusing to start in "
        "production. Set a strong, unique secret in the environment."
    )
