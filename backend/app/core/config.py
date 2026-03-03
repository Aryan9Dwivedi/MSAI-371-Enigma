from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve DB path relative to backend/ so it works regardless of cwd
_BACKEND_DIR = Path(__file__).resolve().parents[2]
_DEFAULT_DB = f"sqlite:///{_BACKEND_DIR}/kraft.db"


class Settings(BaseSettings):
    DATABASE_URL: str = _DEFAULT_DB

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_db_url(cls, v: str) -> str:
        """If path is relative (./kraft.db), resolve to backend dir."""
        if v and v.startswith("sqlite:///./"):
            rel = v.replace("sqlite:///./", "")
            return f"sqlite:///{_BACKEND_DIR}/{rel}"
        return v or _DEFAULT_DB
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    LLM_EXPLANATION_ENABLED: bool = False
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.2
    LLM_TIMEOUT_SECONDS: float = 12.0
    # Azure: api_version from your Azure code (e.g. 2024-12-01-preview)
    LLM_AZURE_API_VERSION: str = "2024-12-01-preview"
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
