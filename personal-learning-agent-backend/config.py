"""Centralized configuration via Pydantic Settings."""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "*"

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    llm_temperature: float = 0.2
    use_mock_llm: bool = True

    database_url: str = "sqlite+aiosqlite:///./data/learner.db"
    chroma_persist_dir: str = "./data/chroma"

    roadmap_service_url: str = "http://localhost:8090"
    roadmap_repo_path: str = ""  # defaults to data/developer-roadmap
    tavily_api_key: str = ""
    google_calendar_enabled: bool = False
    google_calendar_credentials_path: str = ""

    default_quiz_pass_score: int = 70
    inactivity_nudge_days: int = 3

    @property
    def cors_origin_list(self) -> List[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def llm_available(self) -> bool:
        return bool(self.groq_api_key) and not self.use_mock_llm


@lru_cache
def get_settings() -> Settings:
    return Settings()
