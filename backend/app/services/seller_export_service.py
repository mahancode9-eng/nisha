from __future__ import annotations

import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.services import entitlement_service, seller_customer_service

# Excel only reads UTF-8 CSV (Persian text) when the file starts with a BOM.
BOM = "\ufeff"


def _require_export(db: Session, store: Store) -> None:
    entitlement_service.require_entitlement(
        db,
        store.owner_id,
        "excel_export",
        message="خروجی اکسل تو پلن فعلی‌ت فعال نیست.",
    )


def _sanitize_csv_cell(value: object) -> object:
    """Neutralize CSV formula injection (=, +, -, @, tab, CR)."""
    if not isinstance(value, str):
        return value
    if value and value[0] in {"=", "+", "-", "@", "\t", "\r"}:
        return "'" + value
    return value


def export_products_csv(db: Session, store: Store) -> str:
    _require_export(db, store)
    products = db.scalars(
        select(Product)
        .where(Product.store_id == store.id)
        .order_by(Product.id.desc())
    ).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    buffer.write(BOM)
    writer.writerow(["id", "title", "price", "stock_quantity", "is_active", "created_at"])
    for product in products:
        writer.writerow(
            [
                product.id,
                _sanitize_csv_cell(product.title),
                str(product.price),
                product.stock_quantity,
                product.is_active,
                product.created_at.isoformat() if product.created_at else "",
            ]
        )
    return buffer.getvalue()


def export_orders_csv(db: Session, store: Store) -> str:
    _require_export(db, store)
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.store_id == store.id)
        .order_by(Order.id.desc())
    ).all()
    buffer = io.StringIO()
    buffer.write(BOM)
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "invoice_code",
            "status",
            "buyer_name",
            "buyer_phone",
            "total_amount",
            "item_count",
            "created_at",
            "is_manual",
        ]
    )
    for order in orders:
        writer.writerow(
            [
                order.id,
                _sanitize_csv_cell(order.invoice_code),
                order.status.value if hasattr(order.status, "value") else order.status,
                _sanitize_csv_cell(order.buyer_name),
                _sanitize_csv_cell(order.buyer_phone),
                str(order.total_amount),
                len(order.items or []),
                order.created_at.isoformat() if order.created_at else "",
                order.is_manual,
            ]
        )
    return buffer.getvalue()


def export_customers_csv(db: Session, store: Store) -> str:
    """Pro: every buyer with their totals and tags."""
    customers = seller_customer_service.all_customers_for_export(db, store)
    buffer = io.StringIO()
    buffer.write(BOM)
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "name",
            "phone",
            "email",
            "kind",
            "order_count",
            "paid_order_count",
            "total_spent",
            "repeat_buyer",
            "last_order_at",
            "tags",
        ]
    )
    for c in customers:
        writer.writerow(
            [
                _sanitize_csv_cell(c.full_name),
                _sanitize_csv_cell(c.phone or ""),
                _sanitize_csv_cell(c.email or ""),
                c.kind,
                c.order_count,
                c.paid_order_count,
                str(c.total_spent),
                c.is_repeat,
                c.last_order_at.isoformat() if c.last_order_at else "",
                _sanitize_csv_cell("، ".join(c.tags)),
            ]
        )
    return buffer.getvalue()
