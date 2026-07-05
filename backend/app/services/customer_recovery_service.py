from datetime import datetime, timedelta, timezone
import secrets

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.customer_account import CustomerAccount
from app.models.customer_portal import CustomerPasswordRecovery
from app.models.enums import RecoveryChannel
from app.services.auth_service import AuthError, normalize_email
from app.services.customer_auth_service import get_customer_by_email, get_customer_by_phone, normalize_phone

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


def _mask_identifier(identifier: str) -> str:
    if "@" in identifier:
        local, domain = identifier.split("@", 1)
        return f"{local[:2]}***@{domain}"
    if len(identifier) <= 4:
        return "***"
    return f"{identifier[:3]}***{identifier[-2:]}"


def _find_customer(db: Session, login: str) -> CustomerAccount | None:
    login = login.strip()
    if "@" in login:
        return get_customer_by_email(db, login)
    return get_customer_by_phone(db, login)


def request_password_recovery(
    db: Session,
    *,
    login: str,
    channel: RecoveryChannel,
) -> tuple[CustomerPasswordRecovery, str]:
    customer = _find_customer(db, login)
    if customer is None:
        raise AuthError("Account not found", status_code=404)

    normalized_login = normalize_email(login) if "@" in login else normalize_phone(login)
    recent_count = db.scalar(
        select(func.count()).select_from(CustomerPasswordRecovery).where(
            CustomerPasswordRecovery.customer_id == customer.id,
            CustomerPasswordRecovery.login_identifier == normalized_login,
            CustomerPasswordRecovery.expires_at > func.now(),
            CustomerPasswordRecovery.consumed_at.is_(None),
        )
    ) or 0
    if recent_count >= _MAX_RECOVERY_REQUESTS_PER_WINDOW:
        raise AuthError("Too many recovery requests. Please try again later.", status_code=429)

    code = _generate_code()
    recovery = CustomerPasswordRecovery(
        customer_id=customer.id,
        login_identifier=normalized_login,
        channel=channel,
        code_hash=hash_password(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=_RECOVERY_WINDOW_MINUTES),
    )
    db.add(recovery)
    db.commit()
    db.refresh(recovery)
    return recovery, code


def verify_password_recovery(
    db: Session,
    *,
    recovery_id: int,
    code: str,
    new_password: str,
) -> CustomerAccount:
    recovery = db.get(CustomerPasswordRecovery, recovery_id)
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

    customer = db.get(CustomerAccount, recovery.customer_id)
    if customer is None:
        raise AuthError("Account not found", status_code=404)

    customer.password_hash = hash_password(new_password)
    recovery.consumed_at = _utcnow()
    db.add_all([customer, recovery])
    db.commit()
    db.refresh(customer)
    return customer


def build_recovery_hint(identifier: str) -> str:
    return _mask_identifier(identifier)
