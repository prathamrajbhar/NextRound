import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"
    internal_service_secret: str = "internal_secret_key_change_in_production"
    express_api_base_url: str = "http://localhost:4000/api/v1"
    redis_url: str = "redis://localhost:6379"
    llm_provider: str = "gemini" # Options: "gemini", "groq", "ollama"
    gemini_api_key: str = ""
    groq_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    groq_model: str = "llama-3.3-70b-versatile"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    upload_dir: str = os.getenv(
        "UPLOAD_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../api/uploads"))
    )
    # Canonical shared data (aptitude + coding problem banks) lives in the
    # workspace package `packages/shared/data`. We resolve it relative to this
    # file (apps/ai-service/core -> ../../../packages/shared/data) so it works
    # from any cwd (uvicorn, pytest, workers). Override with SHARED_DATA_DIR if
    # the workspace layout ever changes (e.g. packaged containers).
    shared_data_dir: str = os.getenv(
        "SHARED_DATA_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../packages/shared/data"))
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Fail fast in production when the internal callback secret is still a known
# default — silently running with a shared, published secret would let any
# caller impersonate the AI worker to the Express internal webhooks.
_DEFAULT_SECRETS = (
    "internal_secret_key_change_in_production",
    "super-secret-internal-service-key-for-ai-callbacks",
)
if settings.environment.lower() == "production" and settings.internal_service_secret in _DEFAULT_SECRETS:
    raise RuntimeError(
        "INTERNAL_SERVICE_SECRET is set to a known default value. Refusing to start in "
        "production. Set a strong, unique secret in the environment."
    )
