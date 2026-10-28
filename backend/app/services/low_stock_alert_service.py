"""Seller low-stock email alerts (throttled via notification outbox)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.notification import NotificationOutbox
from app.models.product import Product
from app.models.store import Store
from app.services import notification_service
from app.services.messenger_service import channel_configured

logger = logging.getLogger(__name__)

LOW_STOCK_TEMPLATE = "low_stock_seller"
THROTTLE_HOURS = 24


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _products_url() -> str:
    base = (settings.FRONTEND_BASE_URL or "").rstrip("/")
    return f"{base}/seller/products" if base else "/seller/products"


def _recently_alerted(db: Session, email: str, *, now: datetime) -> bool:
    cutoff = now - timedelta(hours=THROTTLE_HOURS)
    row = db.scalar(
        select(NotificationOutbox.id)
        .where(
            NotificationOutbox.recipient == email,
            NotificationOutbox.template == LOW_STOCK_TEMPLATE,
            NotificationOutbox.created_at >= cutoff,
        )
        .limit(1)
    )
    return row is not None


def send_due_low_stock_alerts(db: Session, *, limit: int = 50) -> int:
    """Email store owners once per 24h when they have active low-stock products."""
    threshold = int(settings.LOW_STOCK_THRESHOLD)
    now = _utcnow()
    stores = list(
        db.scalars(
            select(Store)
            .options(selectinload(Store.owner))
            .where(Store.is_active.is_(True))
            .limit(limit * 4)
        ).all()
    )
    sent = 0
    for store in stores:
        if sent >= limit:
            break
        owner = store.owner
        if owner is None or not owner.email:
            continue
        if _recently_alerted(db, owner.email, now=now):
            continue
        products = list(
            db.scalars(
                select(Product)
                .where(
                    Product.store_id == store.id,
                    Product.is_active.is_(True),
                    Product.stock_quantity <= threshold,
                )
                .order_by(Product.stock_quantity.asc(), Product.id.asc())
                .limit(8)
            ).all()
        )
        if not products:
            continue
        lines = [
            f"• {p.title} (موجودی {p.stock_quantity})" for p in products
        ]
        payload = {
            "store_name": store.name,
            "product_count": str(len(products)),
            "product_lines": "\n".join(lines),
            "products_url": _products_url(),
            "threshold": str(threshold),
        }
        try:
            notification_service.enqueue_email(
                db, owner.email, LOW_STOCK_TEMPLATE, payload
            )
            _enqueue_messenger_low_stock(
                db, store=store, product_count=len(products)
            )
            sent += 1
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to enqueue low-stock alert for store %s", store.id
            )
    if sent:
        db.commit()
        logger.info("Enqueued %s low-stock seller alert(s)", sent)
    return sent


def _enqueue_messenger_low_stock(
    db: Session, *, store: Store, product_count: int
) -> None:
    text = (
        f"{product_count} محصول موجودی کم داره\n"
        f"{_products_url()}"
    )
    payload = {
        "text": text,
        "order_url": _products_url(),
        "include_actions": False,
        "photo_url": "",
    }
    targets: list[tuple[str, str | None]] = [
        ("telegram", store.telegram_chat_id),
        ("bale", store.bale_chat_id),
    ]
    for channel, chat_id in targets:
        if not chat_id or not channel_configured(channel):  # type: ignore[arg-type]
            continue
        notification_service.enqueue_messenger(
            db,
            channel=channel,  # type: ignore[arg-type]
            chat_id=chat_id,
            template="seller_messenger_order",
            payload=payload,
        )
