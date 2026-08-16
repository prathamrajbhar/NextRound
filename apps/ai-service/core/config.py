import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"
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
    upload_dir: str = os.getenv(
        "UPLOAD_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../api/uploads"))
    )

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Override port with AI_PORT if set to prevent collision with Node API's PORT setting
if os.getenv("AI_PORT"):
    settings.port = int(os.getenv("AI_PORT"))

# Also map host/environment from AI_HOST/AI_ENVIRONMENT if defined
if os.getenv("AI_HOST"):
    settings.host = os.getenv("AI_HOST")
if os.getenv("AI_ENVIRONMENT"):
    settings.environment = os.getenv("AI_ENVIRONMENT")

_DEFAULT_SECRETS = (
    "internal_secret_key_change_in_production",
    "super-secret-internal-service-key-for-ai-callbacks",
)
if settings.environment.lower() == "production" and settings.internal_service_secret in _DEFAULT_SECRETS:
    raise RuntimeError(
        "INTERNAL_SERVICE_SECRET is set to a known default value. Refusing to start in "
        "production. Set a strong, unique secret in the environment."
    )
