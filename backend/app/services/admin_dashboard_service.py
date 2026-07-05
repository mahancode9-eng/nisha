from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import OrderStatus, UserRole
from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.models.user import User
from app.schemas.admin import AdminDashboardResponse, AdminRecentOrderItem

CONFIRMED_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}
PENDING_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}


def get_admin_dashboard(db: Session) -> AdminDashboardResponse:
    total_stores = db.scalar(select(func.count()).select_from(Store)) or 0
    active_stores = (
        db.scalar(
            select(func.count()).select_from(Store).where(Store.is_active.is_(True))
        )
        or 0
    )
    inactive_stores = total_stores - active_stores

    total_sellers = (
        db.scalar(
            select(func.count()).select_from(User).where(User.role == UserRole.SELLER)
        )
        or 0
    )
    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0

    confirmed_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status.in_(CONFIRMED_STATUSES)
        )
    ) or Decimal("0")

    pending_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status.in_(PENDING_STATUSES)
        )
    ) or Decimal("0")

    recent_rows = db.execute(
        select(
            Order.id,
            Order.invoice_code,
            Order.status,
            Order.total_amount,
            Order.buyer_name,
            Order.created_at,
            Store.name,
            Store.slug,
        )
        .join(Store, Order.store_id == Store.id)
        .order_by(Order.created_at.desc())
        .limit(10)
    ).all()

    recent_orders = [
        AdminRecentOrderItem(
            id=row.id,
            invoice_code=row.invoice_code,
            status=row.status,
            total_amount=row.total_amount,
            store_name=row.name,
            store_slug=row.slug,
            buyer_name=row.buyer_name,
            created_at=row.created_at,
        )
        for row in recent_rows
    ]

    return AdminDashboardResponse(
        total_stores=total_stores,
        active_stores=active_stores,
        inactive_stores=inactive_stores,
        total_sellers=total_sellers,
        total_products=total_products,
        total_orders=total_orders,
        confirmed_revenue=confirmed_revenue,
        pending_revenue=pending_revenue,
        recent_orders=recent_orders,
    )
