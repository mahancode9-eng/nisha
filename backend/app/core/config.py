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
    MAX_VIDEO_UPLOAD_SIZE_BYTES: int = 52_428_800
    LOW_STOCK_THRESHOLD: int = 5
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = False
    RATE_LIMIT_ENABLED: bool = True
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.0
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    S3_ENDPOINT_URL: str = ""
    S3_BUCKET: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_REGION: str = ""
    S3_PUBLIC_BASE_URL: str = ""
    NOTIFY_WORKER_ENABLED: bool = True
    NOTIFY_POLL_INTERVAL_SECONDS: int = 15
    NOTIFY_MAX_ATTEMPTS: int = 5
    SMS_PROVIDER: Literal["console", "kavenegar"] = "console"
    SMS_SENDER: str = ""
    KAVENEGAR_API_KEY: str = ""
    EMAIL_PROVIDER: Literal["console", "smtp", "resend"] = "console"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = ""
    RESEND_API_KEY: str = ""
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 1440
    SUBSCRIPTION_PAYMENT_PROVIDER: Literal["card_to_card"] = "card_to_card"
    SUBSCRIPTION_PROOF_SUBDIR: str = "subscription-proofs"
    ORDER_RESERVATION_MINUTES: int = 20
    PRIVATE_UPLOAD_DIR: str = "./private_uploads"
    ALLOW_DEMO_SEED: bool = False
    RESERVATION_CLEANUP_ENABLED: bool = True
    RESERVATION_CLEANUP_INTERVAL_SECONDS: int = 60

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

    @field_validator("EMAIL_PROVIDER", mode="after")
    @classmethod
    def reject_console_email_in_production(cls, value: str, info) -> str:
        if info.data.get("ENVIRONMENT") == "production" and value == "console":
            raise ValueError(
                "EMAIL_PROVIDER=console is not allowed in production; configure smtp or resend"
            )
        return value

    @field_validator("SMTP_HOST", mode="after")
    @classmethod
    def require_smtp_host_when_smtp(cls, value: str, info) -> str:
        if info.data.get("ENVIRONMENT") == "production" and info.data.get("EMAIL_PROVIDER") == "smtp":
            if not value.strip():
                raise ValueError("SMTP_HOST is required when EMAIL_PROVIDER=smtp in production")
        return value

    @field_validator("EMAIL_FROM", mode="after")
    @classmethod
    def require_email_from_in_production(cls, value: str, info) -> str:
        provider = info.data.get("EMAIL_PROVIDER")
        if info.data.get("ENVIRONMENT") == "production" and provider in {"smtp", "resend"}:
            if not value.strip():
                raise ValueError("EMAIL_FROM is required in production")
        return value

    @field_validator("FRONTEND_BASE_URL", mode="after")
    @classmethod
    def reject_localhost_frontend_in_production(cls, value: str, info) -> str:
        if info.data.get("ENVIRONMENT") == "production":
            lowered = value.lower()
            if "localhost" in lowered or "127.0.0.1" in lowered:
                raise ValueError(
                    "FRONTEND_BASE_URL must not use localhost in production email links"
                )
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
