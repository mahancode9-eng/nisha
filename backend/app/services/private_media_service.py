"""Private media storage and short-lived signed access URLs."""

from __future__ import annotations

import secrets
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from urllib.parse import quote

from jose import JWTError, jwt

from app.core.config import settings

PRIVATE_MEDIA_PREFIX = "/api/v1/media/private/"
_LEGACY_PRIVATE_PREFIXES = (
    "/uploads/payment-proofs/",
    "/uploads/subscription-proofs/",
)


def private_root() -> Path:
    return Path(settings.PRIVATE_UPLOAD_DIR)


def is_private_media_path(url: str) -> bool:
    if not url:
        return False
    if url.startswith(PRIVATE_MEDIA_PREFIX):
        return True
    return any(url.startswith(prefix) for prefix in _LEGACY_PRIVATE_PREFIXES)


def extract_private_key(url: str) -> str | None:
    """Return storage key relative to private (or legacy uploads) root."""
    if url.startswith(PRIVATE_MEDIA_PREFIX):
        key = url[len(PRIVATE_MEDIA_PREFIX) :].split("?", 1)[0]
        return key.lstrip("/") or None
    for prefix in _LEGACY_PRIVATE_PREFIXES:
        if url.startswith(prefix):
            return url[len("/uploads/") :].split("?", 1)[0]
    return None


def save_private_bytes(key: str, content: bytes) -> str:
    destination = private_root() / key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    return f"{PRIVATE_MEDIA_PREFIX}{key}"


def resolve_private_file(key: str) -> Path | None:
    """Resolve a private key, including legacy public upload locations."""
    safe_key = key.replace("\\", "/").lstrip("/")
    if ".." in safe_key.split("/"):
        return None

    private_path = private_root() / safe_key
    if private_path.is_file():
        return private_path

    legacy = Path(settings.UPLOAD_DIR) / safe_key
    if legacy.is_file() and safe_key.split("/", 1)[0] in {
        settings.PAYMENT_PROOF_SUBDIR,
        settings.SUBSCRIPTION_PROOF_SUBDIR,
    }:
        return legacy
    return None


def create_media_access_token(key: str, *, minutes: int = 15) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=minutes)
    payload = {
        "type": "media",
        "key": key,
        "exp": expire,
        "jti": secrets.token_urlsafe(12),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_media_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid media token") from exc
    if payload.get("type") != "media":
        raise ValueError("Invalid media token")
    key = payload.get("key")
    if not isinstance(key, str) or not key:
        raise ValueError("Invalid media token")
    return key


def sign_private_media_url(url: str, *, minutes: int = 15) -> str:
    """Attach a short-lived access token to private media URLs."""
    if not is_private_media_path(url):
        return url
    key = extract_private_key(url)
    if not key:
        return url
    token = create_media_access_token(key, minutes=minutes)
    return f"{PRIVATE_MEDIA_PREFIX}{key}?token={quote(token)}"


# --- WebSocket connection tickets (one-time, short-lived) ---

_consumed_ws_tickets: dict[str, float] = {}
_WS_TICKET_TTL_SECONDS = 60


def _purge_consumed_tickets(now: float) -> None:
    stale = [jti for jti, ts in _consumed_ws_tickets.items() if now - ts > _WS_TICKET_TTL_SECONDS * 2]
    for jti in stale:
        _consumed_ws_tickets.pop(jti, None)


def create_ws_ticket(claims: dict, *, ttl_seconds: int = _WS_TICKET_TTL_SECONDS) -> str:
    expire = datetime.now(UTC) + timedelta(seconds=ttl_seconds)
    payload = {
        **claims,
        "type": "ws_ticket",
        "exp": expire,
        "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def consume_ws_ticket(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as exc:
        raise ValueError("Invalid connection ticket") from exc
    if payload.get("type") != "ws_ticket":
        raise ValueError("Invalid connection ticket")
    jti = payload.get("jti")
    if not isinstance(jti, str):
        raise ValueError("Invalid connection ticket")
    now = time.time()
    _purge_consumed_tickets(now)
    if jti in _consumed_ws_tickets:
        raise ValueError("Connection ticket already used")
    _consumed_ws_tickets[jti] = now
    return payload
