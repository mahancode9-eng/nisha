"""Unpaid-order payment reminder SMS."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

from app.core.security import hash_password
from app.models.enums import OrderStatus, PaymentMethodType, UserRole
from app.models.order import Order
from app.models.payment_method import PaymentMethod
from app.models.store import Store
from app.models.user import User
from app.services.order_notification_service import send_due_payment_reminders


def _seed_pending_order(db, *, expires_in_minutes: int, reminder_sent: bool = False):
    seller = User(
        email="seller-reminder@example.com",
        password_hash=hash_password("securepass"),
        full_name="Seller",
        role=UserRole.SELLER,
        is_active=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(seller)
    db.flush()
    store = Store(
        owner_id=seller.id,
        name="Reminder Store",
        slug="reminder-store",
        is_active=True,
    )
    db.add(store)
    db.flush()
    method = PaymentMethod(
        store_id=store.id,
        type=PaymentMethodType.CARD_TO_CARD,
        display_name="Card",
        card_number="6037991234567890",
        is_active=True,
    )
    db.add(method)
    db.flush()
    now = datetime.now(timezone.utc)
    order = Order(
        store_id=store.id,
        invoice_code="INV-REMIND-1",
        invoice_password_hash=hash_password("pass1234"),
        buyer_name="Buyer",
        buyer_phone="09121234567",
        buyer_address="Tehran",
        payment_method_id=method.id,
        status=OrderStatus.PENDING_PAYMENT,
        subtotal_amount=Decimal("100000"),
        total_amount=Decimal("100000"),
        reservation_expires_at=now + timedelta(minutes=expires_in_minutes),
        payment_reminder_sent_at=now if reminder_sent else None,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def test_payment_reminder_sends_once(db):
    order = _seed_pending_order(db, expires_in_minutes=8)
    with patch("app.services.order_notification_service.notification_service.enqueue_sms") as enqueue:
        sent = send_due_payment_reminders(db)
    assert sent == 1
    enqueue.assert_called_once()
    db.refresh(order)
    assert order.payment_reminder_sent_at is not None

    with patch("app.services.order_notification_service.notification_service.enqueue_sms") as enqueue2:
        sent_again = send_due_payment_reminders(db)
    assert sent_again == 0
    enqueue2.assert_not_called()


def test_payment_reminder_skips_fresh_orders(db):
    _seed_pending_order(db, expires_in_minutes=18)
    with patch("app.services.order_notification_service.notification_service.enqueue_sms") as enqueue:
        sent = send_due_payment_reminders(db)
    assert sent == 0
    enqueue.assert_not_called()
