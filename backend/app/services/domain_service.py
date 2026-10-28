"""Custom domains (Pro): connect, prove ownership with a TXT record, route to the store.

HTTPS is issued on demand by the edge proxy (Caddy `on_demand_tls`), which asks
`tls_allowed()` before getting a certificate — see docs/custom-domains.md.
"""

from __future__ import annotations

import ipaddress
import logging
import re
import secrets
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.domain import StoreDomain
from app.models.store import Store
from app.services import entitlement_service
from app.services.exceptions import ServiceError

logger = logging.getLogger(__name__)

TXT_PREFIX = "_nisha-verify"
_LABEL = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$")


# --- DNS (replaced in tests) ----------------------------------------------


def lookup_txt(name: str) -> list[str]:
    import dns.exception
    import dns.resolver

    try:
        answer = dns.resolver.resolve(name, "TXT", lifetime=6)
    except (dns.exception.DNSException, OSError):
        return []
    return [b"".join(r.strings).decode("utf-8", "replace") for r in answer]


def lookup_pointing(hostname: str) -> tuple[list[str], list[str]]:
    """(CNAME targets, A records) of [hostname]."""
    import dns.exception
    import dns.resolver

    cnames: list[str] = []
    addresses: list[str] = []
    try:
        cnames = [str(r.target).rstrip(".").lower() for r in dns.resolver.resolve(hostname, "CNAME", lifetime=6)]
    except (dns.exception.DNSException, OSError):
        pass
    try:
        addresses = [r.address for r in dns.resolver.resolve(hostname, "A", lifetime=6)]
    except (dns.exception.DNSException, OSError):
        pass
    return cnames, addresses


# --- Hostnames ------------------------------------------------------------


def _csv(value: str) -> list[str]:
    return [v.strip().lower().rstrip(".") for v in value.split(",") if v.strip()]


def _reserved() -> list[str]:
    hosts = _csv(settings.CUSTOM_DOMAIN_RESERVED)
    for url in (settings.FRONTEND_BASE_URL, settings.API_PUBLIC_BASE_URL):
        host = urlparse(url).hostname if url else None
        if host:
            hosts.append(host.lower())
    return hosts


def normalize_hostname(raw: str) -> str:
    value = (raw or "").strip().lower()
    if "://" in value:
        value = urlparse(value).hostname or ""
    value = value.split("/", 1)[0].split(":", 1)[0].rstrip(".")
    try:
        value = value.encode("idna").decode("ascii")
    except UnicodeError:
        raise ServiceError("دامنه معتبر نیست.", status_code=422) from None
    try:
        ipaddress.ip_address(value)
        raise ServiceError("آدرس IP جای دامنه قبول نیست؛ اسم دامنه رو بنویس.", status_code=422)
    except ValueError:
        pass
    labels = value.split(".")
    if len(value) > 253 or len(labels) < 2 or not all(_LABEL.match(label) for label in labels) or labels[-1].isdigit():
        raise ServiceError("دامنه معتبر نیست. مثلاً shop.example.com", status_code=422)
    for reserved in _reserved():
        if value == reserved or value.endswith("." + reserved):
            raise ServiceError("این دامنه مال نیشاست و نمی‌شه وصلش کرد.", status_code=422)
    return value


def txt_name(domain: StoreDomain) -> str:
    return f"{TXT_PREFIX}.{domain.hostname}"


def txt_value(domain: StoreDomain) -> str:
    return f"nisha-verify={domain.verification_token}"


def is_apex(hostname: str) -> bool:
    """example.com (needs an A record) vs shop.example.com (a CNAME works). Rough: two labels."""
    return len(hostname.split(".")) == 2


# --- Seller actions -------------------------------------------------------


def _require_plan(db: Session, store: Store) -> None:
    entitlement_service.require_entitlement(
        db, store.owner_id, "custom_domain", message="دامنه اختصاصی مخصوص پلن حرفه‌ایه."
    )


def get(db: Session, store: Store) -> StoreDomain | None:
    return db.scalar(select(StoreDomain).where(StoreDomain.store_id == store.id))


def connect(db: Session, store: Store, hostname: str) -> StoreDomain:
    _require_plan(db, store)
    host = normalize_hostname(hostname)
    taken = db.scalar(select(StoreDomain).where(StoreDomain.hostname == host))
    if taken is not None and taken.store_id != store.id:
        raise ServiceError("این دامنه به یه فروشگاه دیگه وصله.", status_code=409)
    domain = get(db, store)
    if domain is not None and domain.hostname == host:
        return domain
    if domain is None:
        domain = StoreDomain(store_id=store.id, hostname=host)
        db.add(domain)
    domain.hostname = host
    domain.verification_token = secrets.token_hex(16)
    domain.verified_at = None
    domain.dns_pointing = False
    domain.last_checked_at = None
    domain.last_error = None
    db.commit()
    db.refresh(domain)
    _invalidate()
    return domain


def _points_to_us(hostname: str) -> bool:
    cnames, addresses = lookup_pointing(hostname)
    target = settings.CUSTOM_DOMAIN_CNAME_TARGET.strip().lower().rstrip(".")
    if target and target in cnames:
        return True
    ours = set(_csv(settings.CUSTOM_DOMAIN_IPV4))
    return bool(ours) and bool(ours.intersection(addresses))


def verify(db: Session, store: Store) -> StoreDomain:
    _require_plan(db, store)
    domain = get(db, store)
    if domain is None:
        raise ServiceError("اول دامنه رو وارد کن.", status_code=404)
    now = datetime.now(timezone.utc)
    records = lookup_txt(txt_name(domain))
    owned = txt_value(domain) in [r.strip() for r in records]
    domain.dns_pointing = _points_to_us(domain.hostname)
    domain.last_checked_at = now
    if owned:
        domain.verified_at = domain.verified_at or now
        domain.last_error = None if domain.dns_pointing else "مالکیت تایید شد؛ رکورد اشاره به نیشا هنوز دیده نمی‌شه."
    else:
        domain.verified_at = None
        domain.last_error = (
            "رکورد TXT پیدا شد ولی مقدارش درست نیست." if records else "رکورد TXT هنوز پیدا نشد. تغییر DNS ممکنه تا چند ساعت طول بکشه."
        )
    db.commit()
    db.refresh(domain)
    _invalidate()
    return domain


def disconnect(db: Session, store: Store) -> None:
    domain = get(db, store)
    if domain is not None:
        db.delete(domain)
        db.commit()
        _invalidate()


# --- Routing, HTTPS, CORS -------------------------------------------------


def store_for_host(db: Session, host: str) -> Store | None:
    """The store a verified custom domain serves, while its plan allows it."""
    try:
        hostname = normalize_hostname(host)
    except ServiceError:
        return None
    domain = db.scalar(select(StoreDomain).where(StoreDomain.hostname == hostname))
    if domain is None or domain.verified_at is None:
        return None
    store = db.get(Store, domain.store_id)
    if store is None or not store.is_active:
        return None
    if not entitlement_service.get_seller_entitlements(db, store.owner_id).get("custom_domain"):
        return None
    return store


def tls_allowed(db: Session, host: str) -> bool:
    return store_for_host(db, host) is not None


# Browser requests from a storefront on a custom domain need CORS; the set of
# active domains is cached briefly so this costs one query a minute.
_ACTIVE_TTL = 60.0
_active: dict[str, object] = {"at": 0.0, "hosts": frozenset()}


def _invalidate() -> None:
    _active["at"] = 0.0


def active_hosts(db_factory) -> frozenset[str]:
    if time.monotonic() - float(_active["at"]) < _ACTIVE_TTL:
        return _active["hosts"]  # type: ignore[return-value]
    db = db_factory()
    try:
        hosts = frozenset(
            d.hostname
            for d in db.scalars(select(StoreDomain).where(StoreDomain.verified_at.is_not(None))).all()
            if store_for_host(db, d.hostname) is not None
        )
    except Exception:  # noqa: BLE001 - a DB hiccup must not break CORS for everyone
        logger.warning("custom domain CORS list unavailable", exc_info=True)
        return _active["hosts"]  # type: ignore[return-value]
    finally:
        db.close()
    _active.update(at=time.monotonic(), hosts=hosts)
    return hosts
