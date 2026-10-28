"""Seller nudge for idle PAYMENT_UPLOADED orders (second chase)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import OrderStatus
from app.models.notification import NotificationOutbox
from app.models.order import Order
from app.models.store import Store
from app.services import notification_service
from app.services.messenger_service import channel_configured

logger = logging.getLogger(__name__)

CHASE_TEMPLATE = "payment_proof_chase_seller"
THROTTLE_HOURS = 24


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _orders_url() -> str:
    base = (settings.FRONTEND_BASE_URL or "").rstrip("/")
    return f"{base}/seller/orders" if base else "/seller/orders"


def _recently_chased(db: Session, email: str, *, now: datetime) -> bool:
    cutoff = now - timedelta(hours=THROTTLE_HOURS)
    row = db.scalar(
        select(NotificationOutbox.id)
        .where(
            NotificationOutbox.recipient == email,
            NotificationOutbox.template == CHASE_TEMPLATE,
            NotificationOutbox.created_at >= cutoff,
        )
        .limit(1)
    )
    return row is not None


def send_due_payment_proof_chases(db: Session, *, limit: int = 50) -> int:
    """Email (+ messenger) sellers about proofs waiting longer than the chase window."""
    now = _utcnow()
    idle_before = now - timedelta(hours=max(1, int(settings.PAYMENT_PROOF_CHASE_HOURS)))
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
        if _recently_chased(db, owner.email, now=now):
            continue
        idle_orders = list(
            db.scalars(
                select(Order)
                .where(
                    Order.store_id == store.id,
                    Order.status == OrderStatus.PAYMENT_UPLOADED,
                    Order.updated_at <= idle_before,
                )
                .order_by(Order.updated_at.asc())
                .limit(10)
            ).all()
        )
        if not idle_orders:
            continue
        lines = [
            f"• {o.invoice_code} — {o.buyer_name}" for o in idle_orders
        ]
        payload = {
            "store_name": store.name,
            "order_count": str(len(idle_orders)),
            "order_lines": "\n".join(lines),
            "orders_url": _orders_url(),
        }
        try:
            notification_service.enqueue_email(
                db, owner.email, CHASE_TEMPLATE, payload
            )
            _enqueue_messenger_chase(db, store=store, order_count=len(idle_orders))
            sent += 1
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to enqueue payment-proof chase for store %s", store.id
            )
    if sent:
        db.commit()
        logger.info("Enqueued %s payment-proof chase alert(s)", sent)
    return sent


def _enqueue_messenger_chase(db: Session, *, store: Store, order_count: int) -> None:
    text = (
        f"{order_count} رسید پرداخت منتظر بررسی\n"
        f"{_orders_url()}"
    )
    payload = {
        "text": text,
        "order_url": _orders_url(),
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
            template="seller_messenger_receipt",
            payload=payload,
        )
