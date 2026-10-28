from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.api.service_http import raise_service_error
from app.db.session import get_db
from app.models.store import Store
from app.schemas.shipping_method import (
    ShippingMethodCreate,
    ShippingMethodResponse,
    ShippingMethodUpdate,
)
from app.services import shipping_method_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/shipping-methods", tags=["seller-shipping-methods"])


@router.get("", response_model=list[ShippingMethodResponse])
def list_shipping_methods(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[ShippingMethodResponse]:
    methods = shipping_method_service.list_shipping_methods(db, store)
    return [ShippingMethodResponse.model_validate(method) for method in methods]


@router.post("", response_model=ShippingMethodResponse, status_code=status.HTTP_201_CREATED)
def create_shipping_method(
    payload: ShippingMethodCreate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ShippingMethodResponse:
    try:
        method = shipping_method_service.create_shipping_method(db, store, payload)
    except ServiceError as exc:
        raise_service_error(exc)
    return ShippingMethodResponse.model_validate(method)


@router.put("/{shipping_method_id}", response_model=ShippingMethodResponse)
def update_shipping_method(
    shipping_method_id: int,
    payload: ShippingMethodUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ShippingMethodResponse:
    try:
        method = shipping_method_service.update_shipping_method(
            db,
            store,
            shipping_method_id,
            payload,
        )
    except ServiceError as exc:
        raise_service_error(exc)
    return ShippingMethodResponse.model_validate(method)


@router.delete("/{shipping_method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipping_method(
    shipping_method_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        shipping_method_service.delete_shipping_method(db, store, shipping_method_id)
    except ServiceError as exc:
        raise_service_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
