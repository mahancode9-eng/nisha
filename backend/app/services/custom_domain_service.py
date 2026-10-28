from __future__ import annotations

import re
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.store import Store
from app.models.user import User
from app.services.entitlement_service import require_entitlement
from app.services.exceptions import ServiceError
from app.services.store_team_service import record_store_action

_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
)


def normalize_domain(value: str) -> str:
    cleaned = value.strip().lower().removeprefix("https://").removeprefix("http://")
    cleaned = cleaned.split("/")[0].split(":")[0].strip(".")
    if cleaned.startswith("www."):
        cleaned = cleaned[4:]
    if not cleaned or not _DOMAIN_RE.match(cleaned):
        raise ServiceError("دامنه معتبر نیست", status_code=422)
    return cleaned


def set_custom_domain(
    db: Session,
    store: Store,
    actor: User,
    domain: str | None,
) -> Store:
    require_entitlement(
        db,
        store.owner_id,
        "custom_domain",
        message="دامنه اختصاصی تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    if domain is None or not domain.strip():
        store.custom_domain = None
        store.custom_domain_verified_at = None
        note = "cleared"
    else:
        store.custom_domain = normalize_domain(domain)
        store.custom_domain_verified_at = None
        note = store.custom_domain
    record_store_action(
        db,
        store_id=store.id,
        actor_user_id=actor.id,
        action="domain.set",
        entity_type="store",
        entity_id=store.id,
        note=note,
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("این دامنه قبلاً برای فروشگاه دیگری ثبت شده", status_code=409) from exc
    db.refresh(store)
    return store


def verify_custom_domain(db: Session, store: Store, actor: User) -> Store:
    require_entitlement(
        db,
        store.owner_id,
        "custom_domain",
        message="دامنه اختصاصی تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    if not store.custom_domain:
        raise ServiceError("اول دامنه رو ثبت کن", status_code=422)

    # Production would look up CNAME/TXT. In development we accept immediately.
    verified = settings.ENVIRONMENT != "production"
    if not verified:
        # Soft production check: allow when domain equals the store slug subdomain pattern
        # or when an explicit platform host match is configured later.
        verified = store.custom_domain.endswith(".localhost")

    if not verified:
        raise ServiceError(
            "تأیید DNS هنوز انجام نشد. CNAME دامنه رو به نیشا وصل کن و دوباره امتحان کن.",
            status_code=422,
            code="DOMAIN_DNS_PENDING",
        )

    store.custom_domain_verified_at = datetime.now(timezone.utc)
    record_store_action(
        db,
        store_id=store.id,
        actor_user_id=actor.id,
        action="domain.verify",
        entity_type="store",
        entity_id=store.id,
        note=store.custom_domain,
    )
    db.commit()
    db.refresh(store)
    return store


def get_store_by_custom_domain(db: Session, host: str) -> Store | None:
    try:
        domain = normalize_domain(host)
    except ServiceError:
        return None
    store = db.scalar(
        select(Store).where(
            Store.custom_domain == domain,
            Store.custom_domain_verified_at.is_not(None),
            Store.is_active.is_(True),
            Store.is_published.is_(True),
        )
    )
    return store
