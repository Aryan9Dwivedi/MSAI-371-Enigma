from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./kraft.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    LLM_EXPLANATION_ENABLED: bool = False
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.2
    LLM_TIMEOUT_SECONDS: float = 12.0
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
