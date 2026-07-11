from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.customer_account import CustomerAccount
from app.models.email_verification import EmailVerificationToken
from app.models.enums import VerificationAccountKind
from app.models.user import User
from app.services.customer_auth_service import get_customer_by_email
from app.services.notification_service import deliver_pending, enqueue_email

logger = logging.getLogger(__name__)


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        from app.core.messages import translate_backend_message

        self.message = translate_backend_message(message)
        self.status_code = status_code
        super().__init__(self.message)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == _normalize_email(email)))

_MAX_RESEND_PER_WINDOW = 3
_RESEND_WINDOW_MINUTES = 15


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_tz_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _kind_to_query(kind: str) -> str:
    if kind == "customer":
        return VerificationAccountKind.CUSTOMER.value
    if kind in {"seller", "user", "admin"}:
        return VerificationAccountKind.USER.value
    raise AuthError("Invalid verification kind", status_code=422)


def _query_to_kind(account_kind: VerificationAccountKind) -> str:
    if account_kind == VerificationAccountKind.CUSTOMER:
        return "customer"
    return "seller"


def _build_verify_link(*, raw_token: str, kind: str) -> str:
    base = settings.FRONTEND_BASE_URL.rstrip("/")
    return f"{base}/verify-email?token={quote(raw_token)}&kind={kind}"


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def issue_verification(
    db: Session,
    *,
    account_kind: VerificationAccountKind,
    account_id: int,
    email: str,
    full_name: str,
) -> str:
    raw_token = secrets.token_urlsafe(32)
    token = EmailVerificationToken(
        account_kind=account_kind,
        account_id=account_id,
        email=_normalize_email(email),
        token_hash=_hash_token(raw_token),
        expires_at=_utcnow() + timedelta(minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES),
        created_at=_utcnow(),
    )
    db.add(token)
    db.flush()
    kind = _query_to_kind(account_kind)
    outbox = enqueue_email(
        db,
        _normalize_email(email),
        "email_verification",
        {
            "full_name": full_name,
            "verify_link": _build_verify_link(raw_token=raw_token, kind=kind),
        },
    )
    db.flush()
    try:
        deliver_pending(db, limit=1, notification_ids=[outbox.id])
    except Exception:  # noqa: BLE001 - outbox worker will retry
        logger.exception("Immediate verification email delivery failed")
    return raw_token


def verify_email_token(db: Session, *, token: str, kind: str) -> None:
    account_kind = VerificationAccountKind(_kind_to_query(kind))
    matched = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.account_kind == account_kind,
            EmailVerificationToken.token_hash == _hash_token(token),
            EmailVerificationToken.consumed_at.is_(None),
        )
    )

    if matched is None:
        raise AuthError("Invalid or expired verification token", status_code=400)

    if _ensure_tz_aware(matched.expires_at) < _utcnow():
        raise AuthError("Invalid or expired verification token", status_code=410)

    now = _utcnow()
    matched.consumed_at = now

    if account_kind == VerificationAccountKind.CUSTOMER:
        account = db.get(CustomerAccount, matched.account_id)
        if account is None:
            raise AuthError("Account not found", status_code=404)
        account.email_verified_at = now
        db.add(account)
    else:
        account = db.get(User, matched.account_id)
        if account is None:
            raise AuthError("Account not found", status_code=404)
        account.email_verified_at = now
        db.add(account)

    db.add(matched)
    db.commit()


def resend_verification(db: Session, *, email: str, kind: str) -> None:
    normalized = _normalize_email(email)
    account_kind = VerificationAccountKind(_kind_to_query(kind))

    if account_kind == VerificationAccountKind.CUSTOMER:
        account = get_customer_by_email(db, normalized)
        if account is None or account.email is None:
            return
        if account.email_verified_at is not None:
            return
        full_name = account.full_name
        account_id = account.id
    else:
        account = _get_user_by_email(db, normalized)
        if account is None:
            return
        if account.email_verified_at is not None:
            return
        full_name = account.full_name
        account_id = account.id

    recent_count = db.scalar(
        select(func.count()).select_from(EmailVerificationToken).where(
            EmailVerificationToken.account_kind == account_kind,
            EmailVerificationToken.account_id == account_id,
            EmailVerificationToken.created_at > func.now() - timedelta(minutes=_RESEND_WINDOW_MINUTES),
        )
    ) or 0
    if recent_count >= _MAX_RESEND_PER_WINDOW:
        raise AuthError("Too many verification requests. Please try again later.", status_code=429)

    issue_verification(
        db,
        account_kind=account_kind,
        account_id=account_id,
        email=normalized,
        full_name=full_name,
    )
    db.commit()
