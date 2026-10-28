from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.api.service_http import raise_service_error
from app.db.session import get_db
from app.models.store import Store
from app.schemas.discount import (
    DiscountCodeCreate,
    DiscountCodeResponse,
    DiscountCodeUpdate,
)
from app.services import discount_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/discounts", tags=["seller-discounts"])


@router.get("", response_model=list[DiscountCodeResponse])
def list_discounts(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[DiscountCodeResponse]:
    discounts = discount_service.list_discounts(db, store.id)
    return [DiscountCodeResponse.model_validate(discount) for discount in discounts]


@router.post("", response_model=DiscountCodeResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    payload: DiscountCodeCreate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> DiscountCodeResponse:
    try:
        discount = discount_service.create_discount(db, store.id, payload)
    except ServiceError as exc:
        raise_service_error(exc)
    return DiscountCodeResponse.model_validate(discount)


@router.get("/{discount_id}", response_model=DiscountCodeResponse)
def get_discount(
    discount_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> DiscountCodeResponse:
    try:
        discount = discount_service.get_discount(db, store.id, discount_id)
    except ServiceError as exc:
        raise_service_error(exc)
    return DiscountCodeResponse.model_validate(discount)


@router.put("/{discount_id}", response_model=DiscountCodeResponse)
def update_discount(
    discount_id: int,
    payload: DiscountCodeUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> DiscountCodeResponse:
    try:
        discount = discount_service.update_discount(db, store.id, discount_id, payload)
    except ServiceError as exc:
        raise_service_error(exc)
    return DiscountCodeResponse.model_validate(discount)


@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(
    discount_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        discount_service.delete_discount(db, store.id, discount_id)
    except ServiceError as exc:
        raise_service_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
