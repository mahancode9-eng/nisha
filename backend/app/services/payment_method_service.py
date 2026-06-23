from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import PaymentMethodType
from app.models.payment_method import PaymentMethod
from app.models.store import Store
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodUpdate,
    validate_payment_method_fields,
)
from app.services.exceptions import ServiceError


def list_payment_methods(db: Session, store: Store) -> list[PaymentMethod]:
    return list(
        db.scalars(
            select(PaymentMethod)
            .where(PaymentMethod.store_id == store.id)
            .order_by(PaymentMethod.id)
        ).all()
    )


def get_payment_method(db: Session, store: Store, payment_method_id: int) -> PaymentMethod:
    method = db.scalar(
        select(PaymentMethod).where(
            PaymentMethod.id == payment_method_id,
            PaymentMethod.store_id == store.id,
        )
    )
    if method is None:
        raise ServiceError("Payment method not found", status_code=404)
    return method


def create_payment_method(
    db: Session,
    store: Store,
    data: PaymentMethodCreate,
) -> PaymentMethod:
    method = PaymentMethod(
        store_id=store.id,
        type=data.type,
        display_name=data.display_name,
        card_number=data.card_number,
        wallet_address=data.wallet_address,
        external_url=data.external_url,
        owner_name=data.owner_name,
        instructions=data.instructions,
        is_active=data.is_active,
    )
    _apply_type_field_cleanup(method)
    db.add(method)
    db.commit()
    db.refresh(method)
    return method


def _apply_type_field_cleanup(method: PaymentMethod) -> None:
    if method.type == PaymentMethodType.CARD_TO_CARD:
        method.wallet_address = None
        method.external_url = None
    elif method.type == PaymentMethodType.CRYPTO:
        method.card_number = None
        method.owner_name = None
        method.external_url = None
    elif method.type == PaymentMethodType.EXTERNAL_GATEWAY:
        method.card_number = None
        method.wallet_address = None
        method.owner_name = None


def update_payment_method(
    db: Session,
    store: Store,
    payment_method_id: int,
    data: PaymentMethodUpdate,
) -> PaymentMethod:
    method = get_payment_method(db, store, payment_method_id)
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(method, field, value)

    try:
        validate_payment_method_fields(
            method_type=method.type,
            card_number=method.card_number,
            wallet_address=method.wallet_address,
            external_url=method.external_url,
            owner_name=method.owner_name,
        )
    except ValueError as exc:
        raise ServiceError(str(exc), status_code=422) from exc

    _apply_type_field_cleanup(method)
    db.commit()
    db.refresh(method)
    return method


def delete_payment_method(db: Session, store: Store, payment_method_id: int) -> None:
    method = get_payment_method(db, store, payment_method_id)
    try:
        db.delete(method)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(
            "Cannot delete payment method with existing references",
            status_code=409,
        ) from exc
