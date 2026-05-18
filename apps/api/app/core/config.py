from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    database_url: str = "postgresql+psycopg://grapeee:grapeee@localhost:5432/grapeee"
    public_app_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"
    cors_origins_raw: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    azure_api_key: str | None = None
    azure_openai_chat_completions_url: str = (
        "https://cipher-azure.openai.azure.com/openai/v1/chat/completions"
    )
    azure_openai_model: str = "DeepSeek-V4-Pro"
    azure_reasoning_effort: str = "high"
    azure_top_p: float = 0.1

    openrouter_api_key: str | None = None
    openrouter_model: str | None = None

    resend_api_key: str | None = None
    resend_from: str = "Grapeee <hello@grapeee.dev>"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

