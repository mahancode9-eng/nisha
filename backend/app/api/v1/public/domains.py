from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import DomainResolveResponse
from app.services import domain_service

router = APIRouter(prefix="/domains", tags=["public-domains"])


@router.get("/resolve", response_model=DomainResolveResponse)
def resolve_domain(host: str = Query(max_length=300), db: Session = Depends(get_db)) -> DomainResolveResponse:
    """Which store a custom domain serves (used by the frontend's routing)."""
    store = domain_service.store_for_host(db, host)
    if store is None:
        raise HTTPException(status_code=404, detail="not_found")
    return DomainResolveResponse(slug=store.slug, store_id=store.id)


@router.get("/tls-check")
def tls_check(domain: str = Query(max_length=300), db: Session = Depends(get_db)) -> dict[str, bool]:
    """Caddy's on_demand_tls `ask`: 200 only for verified domains on a plan that allows them."""
    if not domain_service.tls_allowed(db, domain):
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True}
