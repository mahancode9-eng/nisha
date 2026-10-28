from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.schemas.seller_customer import (
    CustomerTagsResponse,
    CustomerTagsUpdate,
    SellerCustomerDetail,
    SellerCustomerListItem,
)
from app.services import seller_customer_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/customers", tags=["seller-customers"])


@router.get("", response_model=PaginatedResponse[SellerCustomerListItem])
def list_customers(
    search: str | None = Query(default=None, max_length=100),
    tag: str | None = Query(default=None, max_length=40),
    repeat_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> PaginatedResponse[SellerCustomerListItem]:
    items, total = seller_customer_service.list_customers_paginated(
        db,
        store,
        page=page,
        page_size=page_size,
        search=search,
        tag=tag,
        repeat_only=repeat_only,
    )
    return build_paginated_response(items, total, page, page_size)


# Before the catch-all detail route below.
@router.get("/tags", response_model=list[str])
def list_customer_tags(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[str]:
    return seller_customer_service.list_tags(db, store)


@router.put("/{customer_key:path}/tags", response_model=CustomerTagsResponse)
def set_customer_tags(
    customer_key: str,
    payload: CustomerTagsUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> CustomerTagsResponse:
    key, tags = seller_customer_service.set_customer_tags(db, store, customer_key, payload.tags)
    return CustomerTagsResponse(key=key, tags=tags)


@router.get("/{customer_key:path}", response_model=SellerCustomerDetail)
def get_customer(
    customer_key: str,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SellerCustomerDetail:
    try:
        return seller_customer_service.get_customer_detail(db, store, customer_key)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
