from __future__ import annotations

import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.services import entitlement_service


def _require_export(db: Session, store: Store) -> None:
    entitlement_service.require_entitlement(
        db,
        store.owner_id,
        "excel_export",
        message="خروجی اکسل در پلن فعلی شما فعال نیست.",
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
            ]
        )
    return buffer.getvalue()
