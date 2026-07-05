from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodUpdate,
)
from app.services import payment_method_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/payment-methods", tags=["seller-payment-methods"])


@router.get("", response_model=list[PaymentMethodResponse])
def list_payment_methods(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[PaymentMethodResponse]:
    methods = payment_method_service.list_payment_methods(db, store)
    return [PaymentMethodResponse.model_validate(method) for method in methods]


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def create_payment_method(
    payload: PaymentMethodCreate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> PaymentMethodResponse:
    try:
        method = payment_method_service.create_payment_method(db, store, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return PaymentMethodResponse.model_validate(method)


@router.get("/{payment_method_id}", response_model=PaymentMethodResponse)
def get_payment_method(
    payment_method_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> PaymentMethodResponse:
    try:
        method = payment_method_service.get_payment_method(db, store, payment_method_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return PaymentMethodResponse.model_validate(method)


@router.put("/{payment_method_id}", response_model=PaymentMethodResponse)
def update_payment_method(
    payment_method_id: int,
    payload: PaymentMethodUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> PaymentMethodResponse:
    try:
        method = payment_method_service.update_payment_method(
            db,
            store,
            payment_method_id,
            payload,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return PaymentMethodResponse.model_validate(method)


@router.delete("/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_method(
    payment_method_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        payment_method_service.delete_payment_method(db, store, payment_method_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
