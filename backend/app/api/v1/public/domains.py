from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import custom_domain_service

router = APIRouter(prefix="/domains", tags=["public-domains"])


class DomainResolveResponse(BaseModel):
    slug: str
    store_id: int


@router.get("/resolve", response_model=DomainResolveResponse)
def resolve_domain(
    host: str = Query(max_length=300),
    db: Session = Depends(get_db),
) -> DomainResolveResponse:
    """Which store a verified custom domain serves (frontend middleware)."""
    store = custom_domain_service.get_store_by_custom_domain(db, host)
    if store is None:
        raise HTTPException(status_code=404, detail="not_found")
    return DomainResolveResponse(slug=store.slug, store_id=store.id)
