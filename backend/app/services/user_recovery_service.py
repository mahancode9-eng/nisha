from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.models.user_password_recovery import UserPasswordRecovery
from app.services.auth_service import AuthError, get_user_by_email, normalize_email
from app.services.notification_service import enqueue_email

_MAX_RECOVERY_REQUESTS_PER_WINDOW = 3
_RECOVERY_WINDOW_MINUTES = 15
_MAX_VERIFY_ATTEMPTS = 5


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_tz_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _mask_email(email: str) -> str:
    local, domain = email.split("@", 1)
    return f"{local[:2]}***@{domain}"


def request_password_recovery(db: Session, *, email: str) -> tuple[UserPasswordRecovery, str]:
    normalized = normalize_email(email)
    user = get_user_by_email(db, normalized)
    if user is None:
        raise AuthError("Account not found", status_code=404)

    recent_count = db.scalar(
        select(func.count()).select_from(UserPasswordRecovery).where(
            UserPasswordRecovery.user_id == user.id,
            UserPasswordRecovery.email == normalized,
            UserPasswordRecovery.expires_at > func.now(),
            UserPasswordRecovery.consumed_at.is_(None),
        )
    ) or 0
    if recent_count >= _MAX_RECOVERY_REQUESTS_PER_WINDOW:
        raise AuthError("Too many recovery requests. Please try again later.", status_code=429)

    code = _generate_code()
    recovery = UserPasswordRecovery(
        user_id=user.id,
        email=normalized,
        code_hash=hash_password(code),
        expires_at=_utcnow() + timedelta(minutes=_RECOVERY_WINDOW_MINUTES),
    )
    db.add(recovery)
    db.flush()
    enqueue_email(
        db,
        normalized,
        "password_recovery_code",
        {"code": code},
    )
    db.commit()
    db.refresh(recovery)
    return recovery, code


def verify_password_recovery(
    db: Session,
    *,
    recovery_id: int,
    code: str,
    new_password: str,
) -> User:
    recovery = db.get(UserPasswordRecovery, recovery_id)
    if recovery is None:
        raise AuthError("Recovery request not found", status_code=404)
    if recovery.consumed_at is not None:
        raise AuthError("Recovery code already used", status_code=409)
    if _ensure_tz_aware(recovery.expires_at) < _utcnow():
        raise AuthError("Recovery code expired", status_code=410)

    if recovery.failed_attempts >= _MAX_VERIFY_ATTEMPTS:
        raise AuthError("Too many failed attempts. Please request a new code.", status_code=429)

    if not verify_password(code, recovery.code_hash):
        recovery.failed_attempts += 1
        db.add(recovery)
        db.commit()
        raise AuthError("Invalid recovery code", status_code=401)

    user = db.scalar(
        select(User)
        .options(selectinload(User.store))
        .where(User.id == recovery.user_id)
    )
    if user is None:
        raise AuthError("Account not found", status_code=404)

    user.password_hash = hash_password(new_password)
    user.email_verified_at = user.email_verified_at or _utcnow()
    recovery.consumed_at = _utcnow()
    db.add_all([user, recovery])
    db.commit()
    db.refresh(user)
    return user


def build_recovery_hint(email: str) -> str:
    return _mask_email(email)
