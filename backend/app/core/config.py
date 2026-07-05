from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WEAK_SECRETS = {"change-me-to-a-long-random-secret", ""}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "production"] = "development"
    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:3000"
    UPLOAD_DIR: str = "./uploads"
    PAYMENT_PROOF_SUBDIR: str = "payment-proofs"
    MAX_UPLOAD_SIZE_BYTES: int = 5_242_880
    LOW_STOCK_THRESHOLD: int = 5
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> str:
        if isinstance(value, list):
            return ",".join(value)
        return value

    @field_validator("JWT_SECRET_KEY", mode="after")
    @classmethod
    def reject_weak_secret(cls, value: str, info) -> str:
        if value in _WEAK_SECRETS or (info.data.get("ENVIRONMENT") == "production" and len(value) < 32):
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters and not a default/placeholder value"
            )
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
