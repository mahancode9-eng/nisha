"""Order lifecycle notifications (roadmap task 12).

Enqueues SMS/email notifications for order events through the transactional
outbox in `notification_service`. All functions are best-effort: a failure to
enqueue must never break the order flow, so errors are logged and swallowed.

Hook points:
- `checkout_service.create_guest_order` -> `notify_order_placed`
- `order_access_service.append_status_history` -> `notify_status_change`
  (covers seller confirm/reject/status changes, guest payment-proof upload
  and customer-portal cancellations, since they all record status history)
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.store import Store
from app.services import messenger_service, notification_service, sms_quota_service
from app.services.entitlement_service import get_seller_entitlements
from app.services.exceptions import ServiceError

logger = logging.getLogger(__name__)


def _invoice_url(invoice_code: str) -> str:
    base = (settings.FRONTEND_BASE_URL or "").rstrip("/")
    return f"{base}/invoice/{invoice_code}" if base else f"/invoice/{invoice_code}"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _enqueue_buyer_sms(
    db: Session,
    store: Store | None,
    phone: str,
    template: str,
    payload: dict,
) -> bool:
    """Enqueue SMS only when the store still has monthly quota."""
    if store is None:
        return False
    if not sms_quota_service.consume_store_sms(db, store):
        return False
    notification_service.enqueue_sms(db, phone, template, payload)
    return True


def _notify_buyer(
    db: Session,
    store: Store | None,
    order: Order,
    template: str,
    payload: dict,
) -> bool:
    """SMS (if opted in) and/or email when the buyer left an address."""
    sent = False
    if order.notify_sms and order.buyer_phone:
        sent = _enqueue_buyer_sms(db, store, order.buyer_phone, template, payload) or sent
    email = (order.buyer_email or "").strip()
    if email:
        notification_service.enqueue_email(db, email, template, payload)
        sent = True
    return sent


def _notify_seller(
    db: Session,
    store: Store,
    template: str,
    payload: dict,
    *,
    messenger_kind: Literal["order", "receipt"] | None = None,
    order: Order | None = None,
) -> None:
    """Email / SMS / messenger based on store notify prefs."""
    if store.notify_by_email:
        owner = store.owner
        if owner is not None and owner.email:
            notification_service.enqueue_email(db, owner.email, template, payload)
    if store.notify_by_sms and store.notify_sms_phone:
        if sms_quota_service.consume_store_sms(db, store):
            notification_service.enqueue_sms(
                db, store.notify_sms_phone, template, payload
            )
    if messenger_kind and order is not None:
        messenger_service.enqueue_seller_messenger(
            db, store=store, order=order, kind=messenger_kind
        )


def _effective_reminder_minutes(db: Session, store: Store | None) -> int:
    default = max(1, int(settings.PAYMENT_REMINDER_MINUTES_BEFORE_EXPIRY))
    if store is None:
        return default
    entitlements = get_seller_entitlements(db, store.owner_id)
    if not entitlements.get("configurable_receipt_reminder"):
        return default
    custom = store.payment_reminder_minutes
    if custom is None:
        return default
    return max(1, min(int(custom), 1440))


# Persian labels used in buyer-facing status change messages.
STATUS_LABELS: dict[OrderStatus, str] = {
    OrderStatus.PENDING_PAYMENT: "در انتظار پرداخت",
    OrderStatus.PAYMENT_UPLOADED: "رسید پرداخت ثبت شد",
    OrderStatus.PAYMENT_CONFIRMED: "پرداخت تایید شد",
    OrderStatus.PAYMENT_REJECTED: "پرداخت رد شد",
    OrderStatus.PREPARING: "در حال آماده‌سازی",
    OrderStatus.SHIPPED: "ارسال شد",
    OrderStatus.DELIVERED: "تحویل شد",
    OrderStatus.CANCELLED: "لغو شد",
    OrderStatus.EXPIRED: "منقضی شد",
}

# Statuses the buyer should be notified about via SMS.
BUYER_NOTIFY_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PAYMENT_REJECTED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
}


def notify_order_placed(
    db: Session,
    order: Order,
    store: Store,
    *,
    invoice_password: str | None = None,
) -> None:
    """Enqueue buyer SMS + seller email when a new order is created.

    Pass [invoice_password] once at create time so the buyer can unlock the invoice
    from SMS without storing the plaintext password.
    """
    try:
        payload = {
            "invoice_code": order.invoice_code,
            "store_name": store.name,
            "invoice_url": _invoice_url(order.invoice_code),
            "invoice_password": (invoice_password or "").strip() or "—",
        }
        _notify_buyer(db, store, order, "order_placed_buyer", payload)
        _notify_seller(
            db,
            store,
            "order_placed_seller",
            payload,
            messenger_kind="order",
            order=order,
        )
    except Exception:  # noqa: BLE001 - notifications must never break checkout
        logger.exception(
            "Failed to enqueue order-placed notifications for order %s", order.id
        )


def send_invoice_recovery_sms(db: Session, store: Store, order: Order) -> None:
    """Seller-triggered recovery: resend invoice link while order is still unpaid/open."""
    if order.status not in {
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAYMENT_UPLOADED,
        OrderStatus.PAYMENT_REJECTED,
    }:
        raise ServiceError(
            "فقط برای سفارش‌های باز می‌شه لینک فاکتور دوباره فرستاد.",
            status_code=422,
        )
    if not (order.notify_sms and order.buyer_phone) and not (order.buyer_email or "").strip():
        raise ServiceError(
            "برای این سفارش راهی برای خبر دادن به خریدار ثبت نشده.",
            status_code=422,
        )
    payload = {
        "invoice_code": order.invoice_code,
        "store_name": store.name,
        "invoice_url": _invoice_url(order.invoice_code),
    }
    if not _notify_buyer(db, store, order, "invoice_recovery_buyer", payload):
        raise ServiceError(
            "سهمیه پیامک این ماه تموم شده یا پیامک فعال نیست.",
            status_code=422,
        )
    db.commit()


def send_due_payment_reminders(db: Session, *, limit: int = 50) -> int:
    """SMS buyers once when unpaid orders are close to reservation expiry."""
    now = _utcnow()
    # Wide scan window; per-order effective minutes may be larger on Basic+.
    scan_window = max(1, int(settings.PAYMENT_REMINDER_MINUTES_BEFORE_EXPIRY), 60)
    reminder_horizon = now + timedelta(minutes=scan_window)
    candidates = list(
        db.scalars(
            select(Order)
            .options(selectinload(Order.store).selectinload(Store.owner))
            .where(
                Order.status == OrderStatus.PENDING_PAYMENT,
                Order.payment_reminder_sent_at.is_(None),
                Order.reservation_expires_at.is_not(None),
                Order.reservation_expires_at > now,
                Order.reservation_expires_at <= reminder_horizon,
            )
            .limit(limit)
        ).all()
    )
    sent = 0
    for order in candidates:
        locked = db.scalar(
            select(Order).where(Order.id == order.id).with_for_update()
        )
        if (
            locked is None
            or locked.status != OrderStatus.PENDING_PAYMENT
            or locked.payment_reminder_sent_at is not None
            or locked.reservation_expires_at is None
        ):
            continue
        expires = locked.reservation_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires <= now:
            continue
        store = locked.store
        window = _effective_reminder_minutes(db, store)
        if expires > now + timedelta(minutes=window):
            continue
        minutes_left = max(1, int((expires - now).total_seconds() // 60))
        payload = {
            "invoice_code": locked.invoice_code,
            "store_name": store.name if store is not None else "",
            "invoice_url": _invoice_url(locked.invoice_code),
            "minutes_left": str(minutes_left),
        }
        try:
            if not _notify_buyer(
                db, store, locked, "payment_reminder_buyer", payload
            ):
                continue
            locked.payment_reminder_sent_at = now
            sent += 1
        except Exception:  # noqa: BLE001
            logger.exception(
                "Failed to enqueue payment reminder for order %s", locked.id
            )
    if sent:
        db.commit()
        logger.info("Enqueued %s unpaid-order payment reminder(s)", sent)
    return sent


def notify_order_expired(db: Session, order: Order) -> None:
    """Notify buyer once when an unpaid reservation expires (recovery link)."""
    try:
        store = order.store
        payload = {
            "invoice_code": order.invoice_code,
            "store_name": store.name if store is not None else "",
            "invoice_url": _invoice_url(order.invoice_code),
        }
        _notify_buyer(db, store, order, "order_expired_buyer", payload)
    except Exception:  # noqa: BLE001
        logger.exception(
            "Failed to enqueue expiry recovery SMS for order %s", order.id
        )


def notify_status_change(db: Session, order: Order, new_status: OrderStatus) -> None:
    """Enqueue notifications for an order status change.

    - Buyer gets SMS/email for statuses in BUYER_NOTIFY_STATUSES.
    - Seller gets email/SMS/messenger when a payment proof is uploaded.
    """
    try:
        store = order.store
        payload = {
            "invoice_code": order.invoice_code,
            "store_name": store.name if store is not None else "",
            "status_label": STATUS_LABELS.get(new_status, new_status.value),
        }

        if new_status in BUYER_NOTIFY_STATUSES:
            _notify_buyer(db, store, order, "order_status_changed", payload)

        if new_status == OrderStatus.PAYMENT_UPLOADED and store is not None:
            _notify_seller(
                db,
                store,
                "payment_uploaded_seller",
                payload,
                messenger_kind="receipt",
                order=order,
            )
    except Exception:  # noqa: BLE001 - notifications must never break the flow
        logger.exception(
            "Failed to enqueue status-change notifications for order %s", order.id
        )
