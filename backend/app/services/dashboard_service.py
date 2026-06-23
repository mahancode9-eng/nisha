from datetime import datetime, time, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import OrderStatus, StoreBadgeType, StoreOnboardingStatus
from app.models.order import Order
from app.models.product import Product
from app.models.store import Store, StoreSocialLink
from app.schemas.dashboard import (
    LowStockProductItem,
    RecentOrderItem,
    SellerDashboardResponse,
)
from app.schemas.onboarding import StoreOnboardingStateResponse
from app.services.trust_service import list_active_badges

CONFIRMED_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}
PENDING_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}


def _count_active_contact_links(db: Session, store_id: int) -> int:
    return db.scalar(
        select(func.count())
        .select_from(StoreSocialLink)
        .where(StoreSocialLink.store_id == store_id, StoreSocialLink.is_active.is_(True))
    ) or 0


def _count_active_products(db: Session, store_id: int) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Product)
        .where(Product.store_id == store_id, Product.is_active.is_(True))
    ) or 0


def _calculate_store_readiness(
    db: Session,
    store: Store,
    *,
    product_count: int,
) -> tuple[int, list[str]]:
    contact_count = _count_active_contact_links(db, store.id)
    badges = list_active_badges(db, store.id)
    verified = any(badge.badge_type == StoreBadgeType.VERIFIED for badge in badges)

    missing_tasks: list[str] = []
    score = 0

    if store.description:
        score += 20
    else:
        missing_tasks.append("توضیحات فروشگاه را اضافه کنید")

    category_complete = bool(store.category_slug and (store.category_slug != "other" or store.category_name))
    if category_complete:
        score += 20
    else:
        missing_tasks.append("دسته‌بندی فروشگاه را انتخاب کنید")

    if store.logo_url:
        score += 15
    else:
        missing_tasks.append("لوگو اضافه کنید")

    if contact_count > 0:
        score += 15
    else:
        missing_tasks.append("راه‌های ارتباطی اضافه کنید")

    if product_count > 0:
        score += 20
    else:
        missing_tasks.append("اولین محصول را منتشر کنید")

    if verified:
        score += 10
    else:
        missing_tasks.append("حساب را تأیید کنید")

    if not store.cover_image_url:
        missing_tasks.append("تصویر جلد اضافه کنید")
    if not store.location:
        missing_tasks.append("موقعیت فروشگاه را اضافه کنید")
    if product_count == 1:
        missing_tasks.append("محصولات بیشتری اضافه کنید")

    return min(score, 100), missing_tasks


def get_dashboard(db: Session, store: Store) -> SellerDashboardResponse:
    store_id = store.id
    onboarding_state = StoreOnboardingStateResponse.model_validate(store.onboarding_state)

    total_orders = db.scalar(
        select(func.count()).select_from(Order).where(Order.store_id == store_id)
    ) or 0

    pending_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.store_id == store_id, Order.status.in_(PENDING_STATUSES))
    ) or 0

    payment_uploaded_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.store_id == store_id, Order.status == OrderStatus.PAYMENT_UPLOADED)
    ) or 0

    confirmed_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.store_id == store_id, Order.status.in_(CONFIRMED_STATUSES))
    ) or 0

    confirmed_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.store_id == store_id, Order.status.in_(CONFIRMED_STATUSES))
    ) or Decimal("0")

    pending_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.store_id == store_id, Order.status.in_(PENDING_STATUSES))
    ) or Decimal("0")

    today_start = datetime.combine(
        datetime.now(timezone.utc).date(),
        time.min,
        tzinfo=timezone.utc,
    )
    today_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            Order.store_id == store_id,
            Order.status.in_(CONFIRMED_STATUSES),
            Order.created_at >= today_start,
        )
    ) or Decimal("0")

    product_count = _count_active_products(db, store_id)
    store_readiness_score, store_readiness_missing_tasks = _calculate_store_readiness(
        db,
        store,
        product_count=product_count,
    )

    low_stock_products = list(
        db.scalars(
            select(Product)
            .where(
                Product.store_id == store_id,
                Product.is_active.is_(True),
                Product.stock_quantity <= settings.LOW_STOCK_THRESHOLD,
            )
            .order_by(Product.stock_quantity.asc(), Product.id.asc())
        ).all()
    )

    recent_orders = list(
        db.scalars(
            select(Order)
            .where(Order.store_id == store_id)
            .order_by(Order.created_at.desc())
            .limit(10)
        ).all()
    )

    return SellerDashboardResponse(
        total_orders=total_orders,
        pending_orders=pending_orders,
        payment_uploaded_orders=payment_uploaded_orders,
        confirmed_orders=confirmed_orders,
        confirmed_revenue=confirmed_revenue,
        pending_revenue=pending_revenue,
        today_revenue=today_revenue,
        low_stock_products=[LowStockProductItem.model_validate(p) for p in low_stock_products],
        recent_orders=[
            RecentOrderItem(
                id=order.id,
                invoice_code=order.invoice_code,
                status=order.status,
                buyer_name=order.buyer_name,
                total_amount=order.total_amount,
                created_at=order.created_at,
            )
            for order in recent_orders
        ],
        store_readiness_score=store_readiness_score,
        store_readiness_missing_tasks=store_readiness_missing_tasks,
        onboarding_status=onboarding_state.status,
        onboarding_current_step=onboarding_state.current_step if onboarding_state.current_step else None,
        onboarding_completed_at=onboarding_state.completed_at,
    )
