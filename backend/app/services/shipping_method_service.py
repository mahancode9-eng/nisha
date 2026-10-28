from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.shipping_method import ShippingMethod
from app.models.store import Store
from app.schemas.shipping_method import ShippingMethodCreate, ShippingMethodUpdate
from app.services.entitlement_service import require_entitlement
from app.services.exceptions import ServiceError


def list_shipping_methods(db: Session, store: Store) -> list[ShippingMethod]:
    return list(
        db.scalars(
            select(ShippingMethod)
            .where(ShippingMethod.store_id == store.id)
            .order_by(ShippingMethod.sort_order, ShippingMethod.id)
        ).all()
    )


def list_active_shipping_methods(db: Session, store_id: int) -> list[ShippingMethod]:
    return list(
        db.scalars(
            select(ShippingMethod)
            .where(
                ShippingMethod.store_id == store_id,
                ShippingMethod.is_active.is_(True),
            )
            .order_by(ShippingMethod.sort_order, ShippingMethod.id)
        ).all()
    )


def get_shipping_method(db: Session, store: Store, method_id: int) -> ShippingMethod:
    method = db.scalar(
        select(ShippingMethod).where(
            ShippingMethod.id == method_id,
            ShippingMethod.store_id == store.id,
        )
    )
    if method is None:
        raise ServiceError("روش ارسال پیدا نشد", status_code=404)
    return method


def create_shipping_method(
    db: Session,
    store: Store,
    data: ShippingMethodCreate,
) -> ShippingMethod:
    require_entitlement(
        db,
        store.owner_id,
        "named_shipping_methods",
        message="روش‌های ارسال نام‌دار تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    method = ShippingMethod(
        store_id=store.id,
        name=data.name.strip(),
        cost=Decimal(data.cost),
        eta_label=(data.eta_label or "").strip() or None,
        is_active=data.is_active,
        sort_order=data.sort_order,
    )
    db.add(method)
    db.commit()
    db.refresh(method)
    return method


def update_shipping_method(
    db: Session,
    store: Store,
    method_id: int,
    data: ShippingMethodUpdate,
) -> ShippingMethod:
    require_entitlement(
        db,
        store.owner_id,
        "named_shipping_methods",
        message="روش‌های ارسال نام‌دار تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    method = get_shipping_method(db, store, method_id)
    update_data = data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = update_data["name"].strip()
    if "eta_label" in update_data and update_data["eta_label"] is not None:
        update_data["eta_label"] = update_data["eta_label"].strip() or None
    for field, value in update_data.items():
        setattr(method, field, value)
    db.commit()
    db.refresh(method)
    return method


def delete_shipping_method(db: Session, store: Store, method_id: int) -> None:
    require_entitlement(
        db,
        store.owner_id,
        "named_shipping_methods",
        message="روش‌های ارسال نام‌دار تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    method = get_shipping_method(db, store, method_id)
    try:
        db.delete(method)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(
            "نمی‌شه این روش ارسال رو پاک کرد چون به سفارش وصل شده",
            status_code=409,
        ) from exc


def resolve_for_checkout(
    db: Session,
    store: Store,
    shipping_method_id: int | None,
) -> ShippingMethod | None:
    active = list_active_shipping_methods(db, store.id)
    if not active:
        if shipping_method_id is not None:
            raise ServiceError("روش ارسال برای این فروشگاه تعریف نشده", status_code=422)
        return None
    if shipping_method_id is None:
        raise ServiceError("روش ارسال رو انتخاب کن", status_code=422)
    method = next((m for m in active if m.id == shipping_method_id), None)
    if method is None:
        raise ServiceError("روش ارسال معتبر نیست", status_code=422)
    return method
