import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = Field(8000, validation_alias="AI_PORT")
    host: str = Field("0.0.0.0", validation_alias="AI_HOST")
    environment: str = Field("development", validation_alias="AI_ENVIRONMENT")
    # Stored as a raw comma-separated string to prevent pydantic-settings from
    # attempting JSON-decode on the env var before any validator can intercept it
    # (list[str]-typed fields trigger automatic JSON parsing at the source level).
    # The public `cors_origins` property below splits it at access time.
    cors_origins_raw: str = Field(
        default="http://localhost:3000",
        validation_alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        """Returns the allowed CORS origins as a list, split from CORS_ORIGINS env var."""
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    internal_service_secret: str = "internal_secret_key_change_in_production"
    api_base_url: str = "http://localhost:4000/api/v1"
    redis_provider: str = Field("local", validation_alias="REDIS_PROVIDER")
    local_redis_url: str = Field("redis://localhost:6379", validation_alias="LOCAL_REDIS_URL")
    redis_url_raw: str = Field("redis://localhost:6379", validation_alias="REDIS_URL")

    @property
    def redis_url(self) -> str:
        raw = (self.local_redis_url or self.redis_url_raw or "redis://localhost:6379").strip()
        if raw.startswith("http://"):
            raw = "redis://" + raw[len("http://"):]
        elif raw.startswith("https://"):
            raw = "rediss://" + raw[len("https://"):]
        elif not raw.startswith("redis://") and not raw.startswith("rediss://"):
            raw = "redis://" + raw
        return raw.rstrip("/")

    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    groq_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    groq_model: str = "llama-3.3-70b-versatile"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    aws_endpoint_url: str = Field("http://192.168.31.239:4566", validation_alias="AWS_ENDPOINT_URL")
    aws_default_region: str = Field("us-east-1", validation_alias="AWS_DEFAULT_REGION")
    aws_access_key_id: str = Field("test", validation_alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = Field("test", validation_alias="AWS_SECRET_ACCESS_KEY")
    aws_s3_bucket: str = Field("nextroundbucket", validation_alias="AWS_S3_BUCKET")
    profile_scraper_base_url: str = Field("http://127.0.0.1:18273", validation_alias="PROFILE_SCRAPER_BASE_URL")
    profile_scraper_timeout_ms: int = Field(90000, validation_alias="PROFILE_SCRAPER_TIMEOUT_MS")

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent.parent / ".env",
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
