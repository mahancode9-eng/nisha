from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


class Storage(Protocol):
    """Minimal storage interface used by the upload utilities."""

    def save(self, key: str, content: bytes, content_type: str | None = None) -> str:
        """Store the bytes under `key` and return the public URL."""
        ...

    def delete(self, key: str) -> None: ...


class LocalStorage:
    """Stores files on the local disk under UPLOAD_DIR, served from /uploads."""

    def save(self, key: str, content: bytes, content_type: str | None = None) -> str:
        destination = Path(settings.UPLOAD_DIR) / key
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return f"/uploads/{key}"

    def delete(self, key: str) -> None:
        (Path(settings.UPLOAD_DIR) / key).unlink(missing_ok=True)


class S3Storage:
    """S3-compatible object storage (AWS S3, ArvanCloud, Liara, MinIO, ...).

    Configured entirely via environment variables - see docs/object-storage.md.
    """

    def __init__(self) -> None:
        import boto3  # imported lazily so the dependency is only needed when used

        missing = [
            name
            for name, value in {
                "S3_BUCKET": settings.S3_BUCKET,
                "S3_ACCESS_KEY_ID": settings.S3_ACCESS_KEY_ID,
                "S3_SECRET_ACCESS_KEY": settings.S3_SECRET_ACCESS_KEY,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(
                "STORAGE_BACKEND=s3 requires these settings: " + ", ".join(missing)
            )

        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL or None,
            region_name=settings.S3_REGION or None,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        )
        self._bucket = settings.S3_BUCKET

    def save(self, key: str, content: bytes, content_type: str | None = None) -> str:
        extra: dict[str, str] = {"ACL": "public-read"}
        if content_type:
            extra["ContentType"] = content_type
        self._client.put_object(Bucket=self._bucket, Key=key, Body=content, **extra)
        return self._public_url(key)

    def delete(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except Exception:
            # A leftover object is not worth failing the request for.
            logger.warning("Failed to delete object %s from S3", key, exc_info=True)

    def _public_url(self, key: str) -> str:
        if settings.S3_PUBLIC_BASE_URL:
            return f"{settings.S3_PUBLIC_BASE_URL.rstrip('/')}/{key}"
        if settings.S3_ENDPOINT_URL:
            return f"{settings.S3_ENDPOINT_URL.rstrip('/')}/{self._bucket}/{key}"
        region = settings.S3_REGION or "us-east-1"
        return f"https://{self._bucket}.s3.{region}.amazonaws.com/{key}"


@lru_cache
def get_storage() -> Storage:
    if settings.STORAGE_BACKEND == "s3":
        return S3Storage()
    return LocalStorage()
