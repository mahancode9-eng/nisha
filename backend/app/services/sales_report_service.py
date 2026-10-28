from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.schemas.analytics import TopProductItem
from app.schemas.sales_report import SalesReportResponse, SalesReportTotals

CONFIRMED_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}


def get_sales_report(db: Session, store_id: int, *, days: int = 30) -> SalesReportResponse:
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)

    confirmed = list(
        db.scalars(
            select(Order).where(
                Order.store_id == store_id,
                Order.status.in_(CONFIRMED_STATUSES),
                Order.created_at >= start_dt,
            )
        ).all()
    )
    order_count = len(confirmed)
    revenue = sum((Decimal(o.total_amount) for o in confirmed), Decimal("0"))
    aov = (revenue / order_count) if order_count else Decimal("0")
    manual_orders = sum(1 for o in confirmed if o.is_manual)

    buyer_keys: dict[str, int] = {}
    for order in confirmed:
        key = (
            f"c:{order.customer_id}"
            if order.customer_id is not None
            else f"g:{(order.buyer_phone or '').strip()}"
        )
        if not key.endswith(":"):
            buyer_keys[key] = buyer_keys.get(key, 0) + 1
    repeat_buyers = sum(1 for count in buyer_keys.values() if count >= 2)

    top_rows = db.execute(
        select(
            OrderItem.product_id,
            OrderItem.product_title_snapshot,
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.total_price), 0),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.store_id == store_id,
            Order.status.in_(CONFIRMED_STATUSES),
            Order.created_at >= start_dt,
        )
        .group_by(OrderItem.product_id, OrderItem.product_title_snapshot)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(10)
    ).all()

    return SalesReportResponse(
        days=days,
        totals=SalesReportTotals(
            orders=order_count,
            revenue=revenue,
            average_order_value=aov.quantize(Decimal("0.01")),
            manual_orders=manual_orders,
            repeat_buyers=repeat_buyers,
        ),
        top_products=[
            TopProductItem(
                product_id=row[0],
                title=row[1],
                quantity=int(row[2]),
                revenue=Decimal(str(row[3])),
            )
            for row in top_rows
        ],
    )
