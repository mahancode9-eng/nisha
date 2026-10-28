"""Phase 6: low-stock seller email throttle."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.notification import NotificationOutbox
from app.models.product import Product
from app.models.store import Store
from app.models.user import User
from app.services.low_stock_alert_service import send_due_low_stock_alerts
from app.services.notification_service import TEMPLATES


def _seed_store_with_low_stock(db, *, email="seller-lowstock@example.com", stock=2):
    seller = User(
        email=email,
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
        name="Low Stock Store",
        slug=f"low-stock-{seller.id}",
        is_active=True,
    )
    db.add(store)
    db.flush()
    product = Product(
        store_id=store.id,
        title="کم‌موجود",
        price=100000,
        stock_quantity=stock,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(store)
    return store, seller, product


def test_low_stock_template_exists():
    assert "low_stock_seller" in TEMPLATES
    assert "order_expired_buyer" in TEMPLATES


def test_low_stock_alert_sends_once_per_day(db):
    store, seller, _product = _seed_store_with_low_stock(db)
    with patch(
        "app.services.low_stock_alert_service.notification_service.enqueue_email"
    ) as enqueue:
        sent = send_due_low_stock_alerts(db)
    assert sent == 1
    enqueue.assert_called_once()
    args = enqueue.call_args
    assert args.args[1] == seller.email
    assert args.args[2] == "low_stock_seller"
    assert "کم‌موجود" in args.args[3]["product_lines"]

    # Simulate a prior outbox row so the 24h throttle kicks in.
    db.add(
        NotificationOutbox(
            channel="email",
            recipient=seller.email,
            template="low_stock_seller",
            payload_json="{}",
            status="sent",
            attempts=1,
            created_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
    )
    db.commit()

    with patch(
        "app.services.low_stock_alert_service.notification_service.enqueue_email"
    ) as enqueue2:
        sent_again = send_due_low_stock_alerts(db)
    assert sent_again == 0
    enqueue2.assert_not_called()
    assert store.id is not None


def test_low_stock_alert_skips_healthy_stock(db):
    _seed_store_with_low_stock(db, email="seller-ok@example.com", stock=50)
    with patch(
        "app.services.low_stock_alert_service.notification_service.enqueue_email"
    ) as enqueue:
        sent = send_due_low_stock_alerts(db)
    assert sent == 0
    enqueue.assert_not_called()
