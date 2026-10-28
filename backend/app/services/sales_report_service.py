"""Monthly sales report (Basic+): paid orders in a Jalali month, manual orders included."""

from __future__ import annotations

from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.models.store import Store
from app.schemas.report import BestSellingProduct, MonthTotals, SalesReportResponse
from app.services import entitlement_service
from app.services.exceptions import ServiceError
from app.utils import jalali

# Orders the seller has been paid for (manual orders are created in one of these).
PAID_STATUSES = (
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
)

BEST_SELLERS_LIMIT = 10


def _paid_in(store_id: int, start: datetime, end: datetime):
    return (
        Order.store_id == store_id,
        Order.status.in_(PAID_STATUSES),
        Order.created_at >= start,
        Order.created_at < end,
    )


def _totals(db: Session, store_id: int, start: datetime, end: datetime) -> tuple[int, Decimal, int, Decimal]:
    row = db.execute(
        select(
            func.count(Order.id),
            func.coalesce(func.sum(Order.total_amount), 0),
            func.coalesce(func.sum(case((Order.is_manual.is_(True), 1), else_=0)), 0),
            func.coalesce(func.sum(case((Order.is_manual.is_(True), Order.total_amount), else_=0)), 0),
        ).where(*_paid_in(store_id, start, end))
    ).one()
    return int(row[0]), Decimal(str(row[1])), int(row[2]), Decimal(str(row[3]))


def _best_sellers(db: Session, store_id: int, start: datetime, end: datetime) -> list[BestSellingProduct]:
    # Deleted products (no product_id) keep their sales under the title they were sold with.
    rows = db.execute(
        select(
            func.max(OrderItem.product_id),
            func.max(OrderItem.product_title_snapshot),
            func.sum(OrderItem.quantity),
            func.sum(OrderItem.total_price),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(*_paid_in(store_id, start, end))
        .group_by(
            OrderItem.product_id,
            case((OrderItem.product_id.is_(None), OrderItem.product_title_snapshot), else_=None),
        )
        .order_by(func.sum(OrderItem.quantity).desc(), func.sum(OrderItem.total_price).desc())
        .limit(BEST_SELLERS_LIMIT)
    ).all()
    return [
        BestSellingProduct(
            product_id=int(pid) if pid is not None else None,
            title=title or "",
            quantity=int(qty or 0),
            revenue=Decimal(str(revenue or 0)),
        )
        for pid, title, qty, revenue in rows
    ]


def monthly_sales(
    db: Session,
    store: Store,
    month: str | None = None,
    *,
    now: datetime | None = None,
) -> SalesReportResponse:
    entitlement_service.require_entitlement(
        db,
        store.owner_id,
        "sales_report",
        message="گزارش فروش تو پلن فعلی‌ت فعال نیست. با پلن پایه بازش کن.",
    )
    try:
        jy, jm = jalali.parse_month(month, now)
    except ValueError:
        raise ServiceError("ماه رو این‌طوری بفرست: 1404-08", status_code=422) from None

    start, end = jalali.month_range(jy, jm)
    count, total, manual_count, manual_total = _totals(db, store.id, start, end)
    py, pm = jalali.shift_month(jy, jm, -1)
    prev_start, prev_end = jalali.month_range(py, pm)
    prev_count, prev_total, _, _ = _totals(db, store.id, prev_start, prev_end)

    current = jalali.current_month(now)
    ny, nm = jalali.shift_month(jy, jm, 1)
    average = (total / count).quantize(Decimal("1"), rounding=ROUND_HALF_UP) if count else Decimal("0")
    return SalesReportResponse(
        month=jalali.month_key(jy, jm),
        month_label=jalali.month_label(jy, jm),
        previous_month=jalali.month_key(py, pm),
        next_month=None if (jy, jm) >= current else jalali.month_key(ny, nm),
        total_sales=total,
        order_count=count,
        average_order_value=average,
        manual_order_count=manual_count,
        manual_sales=manual_total,
        best_sellers=_best_sellers(db, store.id, start, end),
        previous=MonthTotals(total_sales=prev_total, order_count=prev_count),
    )
