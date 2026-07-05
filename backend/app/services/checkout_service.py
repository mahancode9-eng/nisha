from __future__ import annotations

import json
from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

import re

from app.core.security import hash_password
from app.models.enums import OrderStatus, ProductFieldType
from app.models.order import Order, OrderItem
from app.models.payment_method import PaymentMethod
from app.models.product import OrderItemFieldValue, Product, ProductFormField
from app.schemas.public import (
    CheckoutOrderItemSummary,
    CheckoutResponse,
    GuestOrderCreate,
    OrderItemFieldValueInput,
    OrderItemInput,
)
from app.services.exceptions import ServiceError
from app.services.product_service import build_form_field_snapshot
from app.services.public_store_service import get_active_store_by_slug
from app.utils.invoice import generate_invoice_code, generate_invoice_password


@dataclass
class LineItem:
    product_id: int
    quantity: int
    product: Product
    unit_price: Decimal
    total_price: Decimal


def _get_payment_method(
    db: Session,
    store_id: int,
    payment_method_id: int,
) -> PaymentMethod:
    method = db.scalar(
        select(PaymentMethod).where(
            PaymentMethod.id == payment_method_id,
            PaymentMethod.store_id == store_id,
            PaymentMethod.is_active.is_(True),
        )
    )
    if method is None:
        raise ServiceError("Payment method not found", status_code=404)
    return method


def _load_products_for_update(
    db: Session,
    store_id: int,
    items: Sequence[OrderItemInput],
) -> dict[int, Product]:
    product_ids = [item.product_id for item in items]
    products = list(
        db.scalars(
            select(Product)
            .options(selectinload(Product.form_fields))
            .where(Product.id.in_(product_ids), Product.store_id == store_id)
            .with_for_update()
        ).all()
    )
    return {product.id: product for product in products}


def _build_line_items(
    items: Sequence[OrderItemInput],
    products_by_id: dict[int, Product],
) -> list[LineItem]:
    line_items: list[LineItem] = []

    for item in items:
        product = products_by_id.get(item.product_id)
        if product is None:
            raise ServiceError("Product not found", status_code=404)
        if not product.is_active:
            raise ServiceError(
                f"Product is not available: {product.title}",
                status_code=422,
            )
        if item.quantity > product.stock_quantity:
            raise ServiceError(
                f"Insufficient stock for {product.title}",
                status_code=422,
            )

        unit_price = Decimal(product.price)
        line_items.append(
            LineItem(
                product_id=product.id,
                quantity=item.quantity,
                product=product,
                unit_price=unit_price,
                total_price=unit_price * item.quantity,
            )
        )

    return line_items


def _decrement_stock(db: Session, line_items: Sequence[LineItem]) -> None:
    for line in line_items:
        result = db.execute(
            update(Product)
            .where(
                Product.id == line.product_id,
                Product.stock_quantity >= line.quantity,
            )
            .values(stock_quantity=Product.stock_quantity - line.quantity)
        )
        if result.rowcount != 1:
            raise ServiceError(
                f"Insufficient stock for {line.product.title}",
                status_code=422,
            )


def _field_map(product: Product) -> dict[str, ProductFormField]:
    return {field.field_key: field for field in product.form_fields}


def _validate_field_value(field: ProductFormField, payload: OrderItemFieldValueInput) -> dict:
    value = payload.value
    if field.field_type in {ProductFieldType.TEXT, ProductFieldType.TEXTAREA}:
        if value is None or not isinstance(value, str) or not value.strip():
            raise ServiceError(f"{field.label} is required", status_code=422)
        return {"value_text": value.strip(), "value_json": None, "file_url": None}

    if field.field_type == ProductFieldType.NUMBER:
        if value is None or not isinstance(value, (int, float, Decimal)):
            raise ServiceError(f"{field.label} must be a number", status_code=422)
        return {"value_text": None, "value_json": json.dumps(value), "file_url": None}

    if field.field_type in {ProductFieldType.DROPDOWN, ProductFieldType.RADIO}:
        if value is None or not isinstance(value, str) or not value.strip():
            raise ServiceError(f"{field.label} is required", status_code=422)
        options = field.options or []
        allowed_values = {str(option["value"]) for option in options}
        if allowed_values and value not in allowed_values:
            raise ServiceError(f"Invalid value for {field.label}", status_code=422)
        return {"value_text": value.strip(), "value_json": None, "file_url": None}

    if field.field_type == ProductFieldType.CHECKBOX:
        if not isinstance(value, bool):
            raise ServiceError(f"{field.label} must be true or false", status_code=422)
        return {"value_text": None, "value_json": json.dumps(value), "file_url": None}

    if field.field_type == ProductFieldType.FILE_UPLOAD:
        if not payload.file_url:
            raise ServiceError(f"{field.label} file is required", status_code=422)
        return {"value_text": None, "value_json": None, "file_url": payload.file_url}

    raise ServiceError(f"Unsupported field type: {field.field_type}", status_code=422)


def _persist_field_values(
    db: Session,
    order_item: OrderItem,
    payload_fields: Sequence[OrderItemFieldValueInput],
    product: Product,
) -> None:
    field_by_key = _field_map(product)
    seen_keys: set[str] = set()

    for index, payload in enumerate(payload_fields):
        field = field_by_key.get(payload.field_key)
        if field is None:
            raise ServiceError(f"Unknown field: {payload.field_key}", status_code=422)
        if payload.field_key in seen_keys:
            raise ServiceError(f"Duplicate field: {payload.field_key}", status_code=422)
        seen_keys.add(payload.field_key)

        normalized = _validate_field_value(field, payload)
        snapshot = build_form_field_snapshot(field)

        db.add(
            OrderItemFieldValue(
                order_item_id=order_item.id,
                field_key=field.field_key,
                field_label=field.label,
                field_type=field.field_type.value if hasattr(field.field_type, "value") else str(field.field_type),
                sort_order=index,
                value_text=normalized["value_text"],
                value_json=normalized["value_json"],
                file_url=normalized["file_url"],
                field_snapshot_json=json.dumps(snapshot, ensure_ascii=False),
            )
        )

    for field in product.form_fields:
        if field.is_required and field.field_key not in seen_keys:
            raise ServiceError(f"{field.label} is required", status_code=422)


def create_guest_order(
    db: Session,
    slug: str,
    data: GuestOrderCreate,
    *,
    customer_id: int | None = None,
) -> CheckoutResponse:
    store = get_active_store_by_slug(db, slug)
    payment_method = _get_payment_method(db, store.id, data.payment_method_id)

    if not data.items:
        raise ServiceError("سبد خرید نمی‌تواند خالی باشد", status_code=422)

    if not data.buyer_name.strip():
        raise ServiceError("نام گیرنده الزامی است", status_code=422)

    if not data.buyer_address.strip():
        raise ServiceError("آدرس الزامی است", status_code=422)

    phone = data.buyer_phone.strip()
    if not re.match(r"^\+?[\d\s\-()]{7,20}$", phone):
        raise ServiceError("شماره تماس نامعتبر است", status_code=422)

    try:
        products_by_id = _load_products_for_update(db, store.id, data.items)
        line_items = _build_line_items(data.items, products_by_id)
        _decrement_stock(db, line_items)

        subtotal = sum((line.total_price for line in line_items), Decimal("0"))
        plain_password = generate_invoice_password()
        invoice_code = generate_invoice_code(db)

        order = Order(
            store_id=store.id,
            customer_id=customer_id,
            invoice_code=invoice_code,
            invoice_password_hash=hash_password(plain_password),
            buyer_name=data.buyer_name.strip(),
            buyer_phone=phone,
            buyer_address=data.buyer_address.strip(),
            buyer_note=data.buyer_note,
            payment_method_id=payment_method.id,
            status=OrderStatus.PENDING_PAYMENT,
            subtotal_amount=subtotal,
            total_amount=subtotal,
            stock_restored=False,
        )
        db.add(order)
        db.flush()

        created_items: list[OrderItem] = []
        for line in line_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=line.product_id,
                product_title_snapshot=line.product.title,
                unit_price_snapshot=line.unit_price,
                quantity=line.quantity,
                total_price=line.total_price,
            )
            db.add(order_item)
            created_items.append(order_item)
        db.flush()

        for line, item, order_item in zip(line_items, data.items, created_items, strict=True):
            _persist_field_values(db, order_item, item.field_values, line.product)

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Could not create order", status_code=409) from exc
    except ServiceError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.payment_method))
        .where(Order.id == order.id)
    )

    return CheckoutResponse(
        invoice_code=invoice_code,
        invoice_edit_password=plain_password,
        order_id=order.id,
        status=order.status,
        subtotal_amount=order.subtotal_amount,
        total_amount=order.total_amount,
        items=[
            CheckoutOrderItemSummary(
                product_id=item.product_id,
                product_title=item.product_title_snapshot,
                quantity=item.quantity,
                unit_price=item.unit_price_snapshot,
                total_price=item.total_price,
            )
            for item in order.items
        ],
        payment_method=order.payment_method,
    )
