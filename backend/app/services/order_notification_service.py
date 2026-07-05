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

from sqlalchemy.orm import Session

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.store import Store
from app.services import notification_service

logger = logging.getLogger(__name__)

# Persian labels used in buyer-facing status change messages.
STATUS_LABELS: dict[OrderStatus, str] = {
    OrderStatus.PENDING_PAYMENT: "در انتظار پرداخت",
    OrderStatus.PAYMENT_UPLOADED: "رسید پرداخت ثبت شد",
    OrderStatus.PAYMENT_CONFIRMED: "پرداخت تایید شد",
    OrderStatus.PAYMENT_REJECTED: "پرداخت رد شد",
    OrderStatus.PREPARING: "در حال آماده‌سازی",
    OrderStatus.SHIPPED: "ارسال شد",
    OrderStatus.DELIVERED: "تحویل داده شد",
    OrderStatus.CANCELLED: "لغو شد",
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


def notify_order_placed(db: Session, order: Order, store: Store) -> None:
    """Enqueue buyer SMS + seller email when a new order is created."""
    try:
        payload = {
            "invoice_code": order.invoice_code,
            "store_name": store.name,
        }
        if order.buyer_phone:
            notification_service.enqueue_sms(
                db, order.buyer_phone, "order_placed_buyer", payload
            )
        owner = store.owner
        if owner is not None and owner.email:
            notification_service.enqueue_email(
                db, owner.email, "order_placed_seller", payload
            )
    except Exception:  # noqa: BLE001 - notifications must never break checkout
        logger.exception(
            "Failed to enqueue order-placed notifications for order %s", order.id
        )


def notify_status_change(db: Session, order: Order, new_status: OrderStatus) -> None:
    """Enqueue notifications for an order status change.

    - Buyer gets an SMS for statuses in BUYER_NOTIFY_STATUSES.
    - Seller gets an email when a payment proof is uploaded.
    """
    try:
        store = order.store
        payload = {
            "invoice_code": order.invoice_code,
            "store_name": store.name if store is not None else "",
            "status_label": STATUS_LABELS.get(new_status, new_status.value),
        }

        if new_status in BUYER_NOTIFY_STATUSES and order.buyer_phone:
            notification_service.enqueue_sms(
                db, order.buyer_phone, "order_status_changed", payload
            )

        if new_status == OrderStatus.PAYMENT_UPLOADED and store is not None:
            owner = store.owner
            if owner is not None and owner.email:
                notification_service.enqueue_email(
                    db, owner.email, "payment_uploaded_seller", payload
                )
    except Exception:  # noqa: BLE001 - notifications must never break the flow
        logger.exception(
            "Failed to enqueue status-change notifications for order %s", order.id
        )
