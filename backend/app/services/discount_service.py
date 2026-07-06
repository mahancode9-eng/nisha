from __future__ import annotations

from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.discount import (
    DISCOUNT_TYPE_FIXED,
    DISCOUNT_TYPE_PERCENT,
    DiscountCode,
)
from app.schemas.discount import DiscountCodeCreate, DiscountCodeUpdate
from app.services.exceptions import ServiceError

INVALID_CODE_MESSAGE = "کد تخفیف معتبر نیست"
NOT_STARTED_MESSAGE = "کد تخفیف هنوز فعال نشده است"
EXPIRED_MESSAGE = "کد تخفیف منقضی شده است"
MAX_USES_MESSAGE = "سقف استفاده از این کد تخفیف تکمیل شده است"
MIN_ORDER_MESSAGE = "مبلغ سفارش به حداقل لازم برای این کد تخفیف نمی‌رسد"
DUPLICATE_CODE_MESSAGE = "کد تخفیفی با این نام قبلا ثبت شده است"
NOT_FOUND_MESSAGE = "کد تخفیف پیدا نشد"


def normalize_code(code: str) -> str:
    return code.strip().upper()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


# --------------------------------------------------------------------------
# Seller CRUD
# --------------------------------------------------------------------------


def list_discounts(db: Session, store_id: int) -> list[DiscountCode]:
    return list(
        db.scalars(
            select(DiscountCode)
            .where(DiscountCode.store_id == store_id)
            .order_by(DiscountCode.id.desc())
        ).all()
    )


def _validate_type_fields(discount_type: str, percent_off, amount_off) -> None:
    if discount_type == DISCOUNT_TYPE_PERCENT and percent_off is None:
        raise ServiceError("برای تخفیف درصدی مقدار درصد الزامی است", status_code=422)
    if discount_type == DISCOUNT_TYPE_FIXED and amount_off is None:
        raise ServiceError("برای تخفیف مبلغی مقدار مبلغ الزامی است", status_code=422)


def create_discount(db: Session, store_id: int, payload: DiscountCodeCreate) -> DiscountCode:
    _validate_type_fields(payload.discount_type, payload.percent_off, payload.amount_off)
    discount = DiscountCode(
        store_id=store_id,
        code=normalize_code(payload.code),
        description=payload.description,
        discount_type=payload.discount_type,
        percent_off=payload.percent_off,
        amount_off=payload.amount_off,
        min_order_amount=payload.min_order_amount,
        max_uses=payload.max_uses,
        starts_at=payload.starts_at,
        expires_at=payload.expires_at,
        is_active=payload.is_active,
    )
    db.add(discount)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(DUPLICATE_CODE_MESSAGE, status_code=409) from exc
    db.refresh(discount)
    return discount


def get_discount(db: Session, store_id: int, discount_id: int) -> DiscountCode:
    discount = db.scalar(
        select(DiscountCode).where(
            DiscountCode.id == discount_id,
            DiscountCode.store_id == store_id,
        )
    )
    if discount is None:
        raise ServiceError(NOT_FOUND_MESSAGE, status_code=404)
    return discount


def update_discount(
    db: Session,
    store_id: int,
    discount_id: int,
    payload: DiscountCodeUpdate,
) -> DiscountCode:
    discount = get_discount(db, store_id, discount_id)
    data = payload.model_dump(exclude_unset=True)
    if "code" in data and data["code"] is not None:
        data["code"] = normalize_code(data["code"])
    for field, value in data.items():
        setattr(discount, field, value)
    _validate_type_fields(discount.discount_type, discount.percent_off, discount.amount_off)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(DUPLICATE_CODE_MESSAGE, status_code=409) from exc
    db.refresh(discount)
    return discount


def delete_discount(db: Session, store_id: int, discount_id: int) -> None:
    discount = get_discount(db, store_id, discount_id)
    db.delete(discount)
    db.commit()


# --------------------------------------------------------------------------
# Checkout validation and application
# --------------------------------------------------------------------------


def get_valid_discount(db: Session, store_id: int, code: str, subtotal: Decimal) -> DiscountCode:
    normalized = normalize_code(code)
    if not normalized:
        raise ServiceError(INVALID_CODE_MESSAGE, status_code=422)
    discount = db.scalar(
        select(DiscountCode).where(
            DiscountCode.store_id == store_id,
            DiscountCode.code == normalized,
        )
    )
    if discount is None or not discount.is_active:
        raise ServiceError(INVALID_CODE_MESSAGE, status_code=422)

    now = _now_utc()
    if discount.starts_at is not None and _as_aware(discount.starts_at) > now:
        raise ServiceError(NOT_STARTED_MESSAGE, status_code=422)
    if discount.expires_at is not None and _as_aware(discount.expires_at) < now:
        raise ServiceError(EXPIRED_MESSAGE, status_code=422)
    if discount.max_uses is not None and discount.used_count >= discount.max_uses:
        raise ServiceError(MAX_USES_MESSAGE, status_code=422)
    if discount.min_order_amount is not None and subtotal < discount.min_order_amount:
        raise ServiceError(MIN_ORDER_MESSAGE, status_code=422)
    return discount


def compute_discount_amount(discount: DiscountCode, subtotal: Decimal) -> Decimal:
    if discount.discount_type == DISCOUNT_TYPE_PERCENT and discount.percent_off is not None:
        raw = (subtotal * Decimal(discount.percent_off)) / Decimal("100")
        amount = raw.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif discount.discount_type == DISCOUNT_TYPE_FIXED and discount.amount_off is not None:
        amount = Decimal(discount.amount_off)
    else:
        amount = Decimal("0")
    if amount < 0:
        return Decimal("0")
    return min(amount, subtotal)


def consume_discount(db: Session, discount: DiscountCode) -> None:
    """Atomically increment usage; must run inside the checkout transaction."""
    result = db.execute(
        update(DiscountCode)
        .where(
            DiscountCode.id == discount.id,
            or_(
                DiscountCode.max_uses.is_(None),
                DiscountCode.used_count < DiscountCode.max_uses,
            ),
        )
        .values(used_count=DiscountCode.used_count + 1)
    )
    if result.rowcount != 1:
        raise ServiceError(MAX_USES_MESSAGE, status_code=422)


def preview_discount(
    db: Session,
    store_id: int,
    code: str,
    subtotal: Decimal,
) -> tuple[DiscountCode, Decimal]:
    discount = get_valid_discount(db, store_id, code, subtotal)
    return discount, compute_discount_amount(discount, subtotal)
