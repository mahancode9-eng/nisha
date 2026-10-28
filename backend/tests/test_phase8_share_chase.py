"""Phase 8: idle payment-proof chase + low-stock messenger hook."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

from sqlalchemy import update

from app.core.security import hash_password
from app.models.enums import OrderStatus, PaymentMethodType, UserRole
from app.models.notification import NotificationOutbox
from app.models.order import Order
from app.models.payment_method import PaymentMethod
from app.models.store import Store
from app.models.user import User
from app.services.notification_service import TEMPLATES
from app.services.payment_proof_chase_service import send_due_payment_proof_chases


def test_chase_template_exists():
    assert "payment_proof_chase_seller" in TEMPLATES


def _seed_idle_uploaded(db, *, hours_idle: int = 8):
    seller = User(
        email="seller-chase@example.com",
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
        name="Chase Store",
        slug="chase-store",
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
        invoice_code="INV-CHASE-1",
        invoice_password_hash=hash_password("pass1234"),
        buyer_name="Buyer",
        buyer_phone="09120001122",
        buyer_address="Tehran",
        payment_method_id=method.id,
        status=OrderStatus.PAYMENT_UPLOADED,
        subtotal_amount=Decimal("90000"),
        total_amount=Decimal("90000"),
    )
    db.add(order)
    db.commit()
    db.execute(
        update(Order)
        .where(Order.id == order.id)
        .values(updated_at=now - timedelta(hours=hours_idle))
    )
    db.commit()
    db.refresh(order)
    return order, seller


def test_payment_proof_chase_sends_once(db):
    order, seller = _seed_idle_uploaded(db, hours_idle=8)
    with patch(
        "app.services.payment_proof_chase_service.notification_service.enqueue_email"
    ) as enqueue:
        with patch(
            "app.services.payment_proof_chase_service._enqueue_messenger_chase"
        ):
            sent = send_due_payment_proof_chases(db)
    assert sent == 1
    enqueue.assert_called_once()
    assert enqueue.call_args.args[1] == seller.email
    assert enqueue.call_args.args[2] == "payment_proof_chase_seller"
    assert order.invoice_code in enqueue.call_args.args[3]["order_lines"]

    db.add(
        NotificationOutbox(
            channel="email",
            recipient=seller.email,
            template="payment_proof_chase_seller",
            payload_json="{}",
            status="sent",
            attempts=1,
            created_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
    )
    db.commit()

    with patch(
        "app.services.payment_proof_chase_service.notification_service.enqueue_email"
    ) as enqueue2:
        sent_again = send_due_payment_proof_chases(db)
    assert sent_again == 0
    enqueue2.assert_not_called()


def test_payment_proof_chase_skips_fresh_uploads(db):
    _seed_idle_uploaded(db, hours_idle=1)
    with patch(
        "app.services.payment_proof_chase_service.notification_service.enqueue_email"
    ) as enqueue:
        sent = send_due_payment_proof_chases(db)
    assert sent == 0
    enqueue.assert_not_called()
