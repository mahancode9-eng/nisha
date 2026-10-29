"""Custom domains: connect, prove ownership with TXT, optionally check CNAME/A."""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.store import Store
from app.models.user import User
from app.services.entitlement_service import require_entitlement
from app.services.exceptions import ServiceError
from app.services.store_team_service import record_store_action

TXT_PREFIX = "_nisha-verify"
_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
)
_LABEL = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$")


def lookup_txt(name: str) -> list[str]:
    """TXT records for [name]. Overridden in tests."""
    import dns.exception
    import dns.resolver

    try:
        answer = dns.resolver.resolve(name, "TXT", lifetime=6)
    except (dns.exception.DNSException, OSError):
        return []
    return [b"".join(r.strings).decode("utf-8", "replace") for r in answer]


def lookup_pointing(hostname: str) -> tuple[list[str], list[str]]:
    """(CNAME targets, A records) for [hostname]. Overridden in tests."""
    import dns.exception
    import dns.resolver

    cnames: list[str] = []
    addresses: list[str] = []
    try:
        cnames = [
            str(r.target).rstrip(".").lower()
            for r in dns.resolver.resolve(hostname, "CNAME", lifetime=6)
        ]
    except (dns.exception.DNSException, OSError):
        pass
    try:
        addresses = [r.address for r in dns.resolver.resolve(hostname, "A", lifetime=6)]
    except (dns.exception.DNSException, OSError):
        pass
    return cnames, addresses


def _csv(value: str) -> list[str]:
    return [v.strip().lower().rstrip(".") for v in value.split(",") if v.strip()]


def _reserved() -> list[str]:
    hosts = _csv(settings.CUSTOM_DOMAIN_RESERVED)
    for url in (settings.FRONTEND_BASE_URL, settings.API_PUBLIC_BASE_URL):
        host = urlparse(url).hostname if url else None
        if host:
            hosts.append(host.lower())
    return hosts


def normalize_domain(value: str) -> str:
    cleaned = value.strip().lower().removeprefix("https://").removeprefix("http://")
    cleaned = cleaned.split("/")[0].split(":")[0].strip(".")
    if cleaned.startswith("www."):
        cleaned = cleaned[4:]
    try:
        cleaned = cleaned.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ServiceError("دامنه معتبر نیست", status_code=422) from exc
    try:
        ipaddress.ip_address(cleaned)
        raise ServiceError("آدرس IP جای دامنه قبول نیست؛ اسم دامنه رو بنویس.", status_code=422)
    except ValueError:
        pass
    labels = cleaned.split(".")
    if (
        not cleaned
        or not _DOMAIN_RE.match(cleaned)
        or len(cleaned) > 253
        or len(labels) < 2
        or not all(_LABEL.match(label) for label in labels)
        or labels[-1].isdigit()
    ):
        raise ServiceError("دامنه معتبر نیست. مثلاً shop.example.com", status_code=422)
    for reserved in _reserved():
        if cleaned == reserved or cleaned.endswith("." + reserved):
            raise ServiceError("این دامنه مال نیشاست و نمی‌شه وصلش کرد.", status_code=422)
    return cleaned


def verification_token(store: Store, domain: str) -> str:
    material = f"{store.id}:{domain}".encode()
    digest = hmac.new(settings.JWT_SECRET_KEY.encode(), material, hashlib.sha256).hexdigest()
    return digest[:32]


def txt_name_for(domain: str) -> str:
    return f"{TXT_PREFIX}.{domain}"


def txt_value_for(store: Store, domain: str) -> str:
    return f"nisha-verify={verification_token(store, domain)}"


def dns_instruction_fields(store: Store) -> dict[str, Any]:
    domain = store.custom_domain
    if not domain:
        return {
            "custom_domain_txt_name": None,
            "custom_domain_txt_value": None,
            "custom_domain_cname_target": None,
        }
    target = settings.CUSTOM_DOMAIN_CNAME_TARGET.strip() or None
    return {
        "custom_domain_txt_name": txt_name_for(domain),
        "custom_domain_txt_value": txt_value_for(store, domain),
        "custom_domain_cname_target": target,
    }


def _points_to_us(hostname: str) -> bool:
    cnames, addresses = lookup_pointing(hostname)
    target = settings.CUSTOM_DOMAIN_CNAME_TARGET.strip().lower().rstrip(".")
    if target and target in cnames:
        return True
    ours = set(_csv(settings.CUSTOM_DOMAIN_IPV4))
    return bool(ours) and bool(ours.intersection(addresses))


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

    domain = store.custom_domain
    # Local/dev: accept immediately so tests and staging without DNS still work.
    if settings.ENVIRONMENT != "production" or domain.endswith(".localhost"):
        store.custom_domain_verified_at = datetime.now(timezone.utc)
        record_store_action(
            db,
            store_id=store.id,
            actor_user_id=actor.id,
            action="domain.verify",
            entity_type="store",
            entity_id=store.id,
            note=domain,
        )
        db.commit()
        db.refresh(store)
        return store

    expected = txt_value_for(store, domain)
    records = [r.strip() for r in lookup_txt(txt_name_for(domain))]
    if expected not in records:
        raise ServiceError(
            "رکورد TXT پیدا شد ولی مقدارش درست نیست."
            if records
            else "رکورد TXT هنوز پیدا نشد. تغییر DNS ممکنه تا چند ساعت طول بکشه.",
            status_code=422,
            code="DOMAIN_DNS_PENDING",
        )

    if settings.CUSTOM_DOMAIN_CNAME_TARGET.strip() or settings.CUSTOM_DOMAIN_IPV4.strip():
        if not _points_to_us(domain):
            raise ServiceError(
                "مالکیت تایید شد، ولی دامنه هنوز به نیشا اشاره نمی‌کنه. CNAME یا A رو چک کن.",
                status_code=422,
                code="DOMAIN_POINTING_PENDING",
            )

    store.custom_domain_verified_at = datetime.now(timezone.utc)
    record_store_action(
        db,
        store_id=store.id,
        actor_user_id=actor.id,
        action="domain.verify",
        entity_type="store",
        entity_id=store.id,
        note=domain,
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


def resolve_slug_for_host(db: Session, host: str) -> str | None:
    store = get_store_by_custom_domain(db, host)
    return store.slug if store else None
