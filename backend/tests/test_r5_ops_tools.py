"""R5: receipt fields, duplicate warn, SMS quota, shipping methods."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

from app.core.security import hash_password
from app.models.enums import BillingPeriod, OrderStatus, PaymentMethodType, UserRole
from app.models.order import Order
from app.models.payment_method import PaymentMethod
from app.models.store import Store
from app.models.user import User
from app.services import entitlement_service, subscription_billing_service
from app.services.order_notification_service import send_due_payment_reminders
from app.services.sms_quota_service import can_send_store_sms, consume_store_sms

PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_payment_method_exposes_bank_and_last4(client, public_store):
    res = client.post(
        "/api/v1/seller/payment-methods",
        headers=public_store["seller_headers"],
        json={
            "type": "CARD_TO_CARD",
            "display_name": "ملی",
            "card_number": "6037-9911-4455-7788",
            "bank_name": "ملی",
            "owner_name": "فروشنده",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["bank_name"] == "ملی"
    assert body["card_last4"] == "7788"


def test_shipping_methods_crud_and_checkout(client, public_store):
    create = client.post(
        "/api/v1/seller/shipping-methods",
        headers=public_store["seller_headers"],
        json={"name": "پست پیشتاز", "cost": "45000", "eta_label": "۲ تا ۴ روز"},
    )
    assert create.status_code == 201
    method_id = create.json()["id"]

    store_page = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert store_page.status_code == 200
    methods = store_page.json()["shipping_methods"]
    assert len(methods) == 1
    assert methods[0]["name"] == "پست پیشتاز"

    missing = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Guest",
            "buyer_phone": "09120001122",
            "buyer_address": "Tehran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
        },
    )
    assert missing.status_code == 422

    order = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Guest",
            "buyer_phone": "09120001122",
            "buyer_address": "Tehran",
            "payment_method_id": public_store["payment_method_id"],
            "shipping_method_id": method_id,
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
        },
    )
    assert order.status_code == 201
    body = order.json()
    assert body["shipping_method_id"] == method_id
    assert body["shipping_method_name"] == "پست پیشتاز"
    assert Decimal(body["shipping_amount"]) == Decimal("45000")


def test_duplicate_receipt_warns_on_basic(client, public_store, placed_order, db):
    first = client.post(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
        data={
            "invoice_edit_password": placed_order["password"],
            "payer_card_last4": "1234",
            "transfer_tracking": "TRX-1",
        },
        files={"file": ("proof.png", PNG_BYTES, "image/png")},
    )
    assert first.status_code == 200
    assert first.json()["proof"]["payer_card_last4"] == "1234"
    assert first.json()["duplicate_warning"] is False

    # Second unpaid order, same image bytes.
    second_create = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Guest 2",
            "buyer_phone": "09123334455",
            "buyer_address": "Tehran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
        },
    )
    assert second_create.status_code == 201
    second = second_create.json()
    dup = client.post(
        f"/api/v1/public/orders/{second['invoice_code']}/upload-payment-proof",
        data={"invoice_edit_password": second["invoice_edit_password"]},
        files={"file": ("proof.png", PNG_BYTES, "image/png")},
    )
    assert dup.status_code == 200
    assert dup.json()["duplicate_warning"] is True
    assert placed_order["invoice_code"] in dup.json()["duplicate_invoice_codes"]


def test_configurable_reminder_minutes(db):
    entitlement_service.ensure_plans_seeded(db)
    seller = User(
        email="seller-r5-remind@example.com",
        password_hash=hash_password("securepass"),
        full_name="Seller",
        role=UserRole.SELLER,
        is_active=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(seller)
    db.flush()
    subscription_billing_service.admin_assign_plan(
        db,
        seller.id,
        plan_code="basic",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    store = Store(
        owner_id=seller.id,
        name="R5 Remind",
        slug="r5-remind",
        is_active=True,
        payment_reminder_minutes=20,
    )
    db.add(store)
    db.flush()
    method = PaymentMethod(
        store_id=store.id,
        type=PaymentMethodType.CARD_TO_CARD,
        display_name="Card",
        card_number="6037991234567890",
        owner_name="Owner",
        is_active=True,
    )
    db.add(method)
    db.flush()
    now = datetime.now(timezone.utc)
    order = Order(
        store_id=store.id,
        invoice_code="INV-R5-REM",
        invoice_password_hash=hash_password("pass1234"),
        buyer_name="Buyer",
        buyer_phone="09121234567",
        buyer_address="Tehran",
        payment_method_id=method.id,
        status=OrderStatus.PENDING_PAYMENT,
        subtotal_amount=Decimal("100000"),
        total_amount=Decimal("100000"),
        reservation_expires_at=now + timedelta(minutes=15),
    )
    db.add(order)
    db.commit()

    with patch(
        "app.services.order_notification_service.notification_service.enqueue_sms"
    ) as enqueue:
        sent = send_due_payment_reminders(db)
    assert sent == 1
    enqueue.assert_called_once()


def test_sms_quota_blocks_free_plan(db):
    entitlement_service.ensure_plans_seeded(db)
    seller = User(
        email="seller-r5-sms@example.com",
        password_hash=hash_password("securepass"),
        full_name="Seller",
        role=UserRole.SELLER,
        is_active=True,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(seller)
    db.flush()
    entitlement_service.ensure_seller_subscription(db, seller.id)
    store = Store(
        owner_id=seller.id,
        name="Free SMS",
        slug="free-sms",
        is_active=True,
    )
    db.add(store)
    db.commit()
    db.refresh(store)

    assert can_send_store_sms(db, store) is False
    assert consume_store_sms(db, store) is False
