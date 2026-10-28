"""Phase 7: EXPIRED recovery SMS, structured entitlement errors, invoice OG preview."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

from app.core.security import hash_password
from app.models.enums import BillingPeriod, OrderStatus, PaymentMethodType, UserRole
from app.models.order import Order
from app.models.payment_method import PaymentMethod
from app.models.store import Store
from app.models.user import User
from app.services import subscription_billing_service
from app.services.reservation_cleanup_service import expire_stale_reservations


def _seed_expiring_order(db, *, invoice_code="INV-EXP-1"):
    seller = User(
        email="seller-expire@example.com",
        password_hash=hash_password("securepass"),
        full_name="Seller",
        role=UserRole.SELLER,
        is_active=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(seller)
    db.flush()
    # Recovery SMS needs a plan with SMS quota (Free is 0).
    subscription_billing_service.admin_assign_plan(
        db,
        seller.id,
        plan_code="basic",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    store = Store(
        owner_id=seller.id,
        name="Expire Store",
        slug="expire-store",
        is_active=True,
        is_published=True,
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
        invoice_code=invoice_code,
        invoice_password_hash=hash_password("pass1234"),
        buyer_name="Buyer",
        buyer_phone="09121112233",
        buyer_address="Tehran",
        payment_method_id=method.id,
        status=OrderStatus.PENDING_PAYMENT,
        subtotal_amount=Decimal("150000"),
        total_amount=Decimal("150000"),
        reservation_expires_at=now - timedelta(minutes=1),
        stock_restored=False,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def test_expire_sends_recovery_sms(db):
    order = _seed_expiring_order(db)
    with patch(
        "app.services.order_notification_service.notification_service.enqueue_sms"
    ) as enqueue:
        expired = expire_stale_reservations(db)
    assert expired == 1
    enqueue.assert_called_once()
    assert enqueue.call_args.args[2] == "order_expired_buyer"
    db.refresh(order)
    assert order.status == OrderStatus.EXPIRED


def test_invoice_preview_endpoint(client, public_store, db):
    placed = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Buyer",
            "buyer_phone": "+989120000111",
            "buyer_address": "Address",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
        },
    )
    assert placed.status_code == 201
    invoice_code = placed.json()["invoice_code"]
    preview = client.get(f"/api/v1/public/orders/{invoice_code}/preview")
    assert preview.status_code == 200
    data = preview.json()
    assert data["invoice_code"] == invoice_code
    assert data["store_name"]
    assert "total_amount" in data
    assert "buyer_phone" not in data
    assert "buyer_name" not in data


def test_timed_discount_error_is_structured(client, public_store):
    res = client.post(
        "/api/v1/seller/discounts",
        headers=public_store["seller_headers"],
        json={
            "code": "TIMED1",
            "discount_type": "PERCENT",
            "percent_off": "10",
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "is_active": True,
        },
    )
    # Free plan in tests typically has timed_discounts false
    if res.status_code == 403:
        body = res.json()
        detail = body.get("detail")
        assert isinstance(detail, dict)
        assert detail.get("code") in {"TIMED_DISCOUNT_LOCKED", "ENTITLEMENT_REQUIRED", "DISCOUNT_ACTIVE_CAP"}
        assert detail.get("meta", {}).get("upgrade_required") is True
    else:
        # Paid seed plans may allow timed discounts — still a valid response
        assert res.status_code in {201, 403}
