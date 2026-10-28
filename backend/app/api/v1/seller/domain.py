from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.api.service_http import raise_service_error
from app.core.config import settings
from app.db.session import get_db
from app.models.domain import StoreDomain
from app.models.store import Store
from app.schemas.domain import DnsRecord, DomainConnect, DomainResponse
from app.services import domain_service, entitlement_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/domain", tags=["seller-domain"])


def _response(db: Session, store: Store, domain: StoreDomain | None) -> DomainResponse:
    enabled = bool(entitlement_service.get_seller_entitlements(db, store.owner_id).get("custom_domain"))
    if domain is None:
        return DomainResponse(plan_enabled=enabled)
    records = [DnsRecord(type="TXT", name=domain_service.txt_name(domain), value=domain_service.txt_value(domain))]
    ipv4 = [ip.strip() for ip in settings.CUSTOM_DOMAIN_IPV4.split(",") if ip.strip()]
    if domain_service.is_apex(domain.hostname) and ipv4:
        records += [DnsRecord(type="A", name=domain.hostname, value=ip) for ip in ipv4]
    else:
        records.append(DnsRecord(type="CNAME", name=domain.hostname, value=settings.CUSTOM_DOMAIN_CNAME_TARGET))
    if domain.verified_at is None:
        state = "pending"
    elif domain.dns_pointing:
        state = "active"
    else:
        state = "verified"
    return DomainResponse(
        plan_enabled=enabled,
        hostname=domain.hostname,
        status=state,
        records=records,
        dns_pointing=domain.dns_pointing,
        verified_at=domain.verified_at,
        last_checked_at=domain.last_checked_at,
        last_error=domain.last_error,
        url=f"https://{domain.hostname}" if state == "active" else None,
    )


@router.get("", response_model=DomainResponse)
def get_domain(store: Store = Depends(get_seller_store), db: Session = Depends(get_db)) -> DomainResponse:
    return _response(db, store, domain_service.get(db, store))


@router.put("", response_model=DomainResponse)
def connect_domain(
    payload: DomainConnect,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> DomainResponse:
    try:
        return _response(db, store, domain_service.connect(db, store, payload.hostname))
    except ServiceError as exc:
        raise_service_error(exc)


@router.post("/verify", response_model=DomainResponse)
def verify_domain(store: Store = Depends(get_seller_store), db: Session = Depends(get_db)) -> DomainResponse:
    try:
        return _response(db, store, domain_service.verify(db, store))
    except ServiceError as exc:
        raise_service_error(exc)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_domain(store: Store = Depends(get_seller_store), db: Session = Depends(get_db)) -> None:
    domain_service.disconnect(db, store)
