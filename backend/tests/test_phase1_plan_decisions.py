"""Phase 1: guest on free, one active discount, messenger bots, outbox delivery."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.enums import BillingPeriod, OrderStatus
from app.models.notification import NotificationOutbox
from app.services import entitlement_service, messenger_service, notification_service
from app.services.notification_service import STATUS_SENT, deliver_pending


def _seller_id(db: Session, email: str = "seller-a@example.com") -> int:
    from sqlalchemy import select

    from app.models.user import User
    from app.services.auth_service import normalize_email

    user = db.scalar(select(User).where(User.email == normalize_email(email)))
    assert user is not None
    return user.id


def test_free_plan_allows_guest_checkout(client: TestClient, seller_headers: dict[str, str], db: Session):
    """Default free sellers can take guest orders when store + platform flags are on."""
    seller_id = _seller_id(db)
    ents = entitlement_service.get_seller_entitlements(db, seller_id)
    assert ents["guest_checkout"] is True

    enable = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"guest_checkout_enabled": True, "is_published": True},
    )
    assert enable.status_code == 200

    product = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "Free Guest Mug",
            "price": "10.00",
            "stock_quantity": 5,
            "is_active": True,
        },
    )
    assert product.status_code == 201
    payment = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json={
            "type": "CARD_TO_CARD",
            "display_name": "Card",
            "card_number": "6037123456789012",
            "owner_name": "Seller A",
        },
    )
    assert payment.status_code == 201

    order = client.post(
        "/api/v1/public/stores/seller-a/orders",
        json={
            "buyer_name": "Guest Buyer",
            "buyer_phone": "09121112233",
            "buyer_address": "Tehran",
            "payment_method_id": payment.json()["id"],
            "items": [{"product_id": product.json()["id"], "quantity": 1}],
        },
    )
    assert order.status_code == 201


def test_free_plan_one_active_discount_cap(client: TestClient, seller_headers: dict[str, str]):
    first = client.post(
        "/api/v1/seller/discounts",
        headers=seller_headers,
        json={
            "code": "FREEONE",
            "discount_type": "PERCENT",
            "percent_off": "10",
            "is_active": True,
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/seller/discounts",
        headers=seller_headers,
        json={
            "code": "FREETWO",
            "discount_type": "PERCENT",
            "percent_off": "5",
            "is_active": True,
        },
    )
    assert second.status_code == 403
    second_detail = second.json()["detail"]
    second_text = (
        second_detail["message"] if isinstance(second_detail, dict) else second_detail
    )
    assert "یک کد" in second_text or "ارتقا" in second_text
    if isinstance(second_detail, dict):
        assert second_detail.get("code") == "DISCOUNT_ACTIVE_CAP"

    inactive = client.post(
        "/api/v1/seller/discounts",
        headers=seller_headers,
        json={
            "code": "DRAFT",
            "discount_type": "PERCENT",
            "percent_off": "15",
            "is_active": False,
        },
    )
    assert inactive.status_code == 201

    activate = client.put(
        f"/api/v1/seller/discounts/{inactive.json()['id']}",
        headers=seller_headers,
        json={"is_active": True},
    )
    assert activate.status_code == 403


def test_free_plan_cannot_set_discount_expiry(client: TestClient, seller_headers: dict[str, str]):
    response = client.post(
        "/api/v1/seller/discounts",
        headers=seller_headers,
        json={
            "code": "EXPIREME",
            "discount_type": "PERCENT",
            "percent_off": "10",
            "is_active": True,
            "expires_at": "2099-12-31T23:59:00Z",
        },
    )
    assert response.status_code == 403
    detail = response.json()["detail"]
    detail_text = detail["message"] if isinstance(detail, dict) else detail
    assert "انقضا" in detail_text or "ارتقا" in detail_text
    if isinstance(detail, dict):
        assert detail.get("code") == "TIMED_DISCOUNT_LOCKED"
        assert detail.get("meta", {}).get("upgrade_required") is True


def test_basic_plan_can_set_discount_expiry(
    client: TestClient,
    seller_headers: dict[str, str],
    db: Session,
):
    from app.services import subscription_billing_service

    subscription_billing_service.admin_assign_plan(
        db,
        _seller_id(db),
        plan_code="basic",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    response = client.post(
        "/api/v1/seller/discounts",
        headers=seller_headers,
        json={
            "code": "BASICEXP",
            "discount_type": "PERCENT",
            "percent_off": "10",
            "is_active": True,
            "expires_at": "2099-12-31T23:59:00Z",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["expires_at"] is not None


def test_basic_plan_unlimited_active_discounts(
    client: TestClient,
    seller_headers: dict[str, str],
    db: Session,
):
    from app.services import subscription_billing_service

    subscription_billing_service.admin_assign_plan(
        db,
        _seller_id(db),
        plan_code="basic",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    for i in range(3):
        res = client.post(
            "/api/v1/seller/discounts",
            headers=seller_headers,
            json={
                "code": f"BASIC{i}",
                "discount_type": "PERCENT",
                "percent_off": "10",
                "is_active": True,
            },
        )
        assert res.status_code == 201, res.text


def test_messenger_link_and_callback_confirm(
    client: TestClient,
    public_store: dict,
    db: Session,
    monkeypatch,
):
    monkeypatch.setattr(messenger_service.settings, "TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setattr(messenger_service.settings, "TELEGRAM_BOT_USERNAME", "nisha_bot")
    monkeypatch.setattr(messenger_service.settings, "TELEGRAM_WEBHOOK_SECRET", "secret")
    monkeypatch.setattr(messenger_service.settings, "ENVIRONMENT", "development")

    store = client.get("/api/v1/seller/store", headers=public_store["seller_headers"]).json()
    token = messenger_service.create_link_token(store["id"], "telegram")

    with patch.object(messenger_service, "send_messenger_message") as send_mock:
        linked = client.post(
            "/api/v1/webhooks/telegram",
            headers={"X-Telegram-Bot-Api-Secret-Token": "secret"},
            json={
                "message": {
                    "text": f"/start link_{token}",
                    "chat": {"id": 424242},
                }
            },
        )
        assert linked.status_code == 200
        assert linked.json()["status"] == "linked"
        send_mock.assert_called()

    refreshed = client.get("/api/v1/seller/store", headers=public_store["seller_headers"]).json()
    assert refreshed["telegram_chat_id"] == "424242"

    order = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Buyer",
            "buyer_phone": "09123334455",
            "buyer_address": "Tehran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
        },
    )
    assert order.status_code == 201
    order_id = order.json()["order_id"]

    # Mark payment uploaded so confirm is valid
    from sqlalchemy import select

    from app.models.order import Order

    row = db.scalar(select(Order).where(Order.id == order_id))
    assert row is not None
    row.status = OrderStatus.PAYMENT_UPLOADED
    db.commit()

    with patch.object(messenger_service, "answer_callback") as ack:
        confirmed = client.post(
            "/api/v1/webhooks/telegram",
            headers={"X-Telegram-Bot-Api-Secret-Token": "secret"},
            json={
                "callback_query": {
                    "id": "cq1",
                    "data": f"confirm:{order_id}",
                    "message": {"chat": {"id": 424242}},
                }
            },
        )
        assert confirmed.status_code == 200
        assert confirmed.json()["status"] == "confirmed"
        ack.assert_called()

    row = db.scalar(select(Order).where(Order.id == order_id))
    assert row is not None
    assert row.status == OrderStatus.PAYMENT_CONFIRMED


def test_messenger_enqueue_text_only_on_free(db: Session, monkeypatch):
    monkeypatch.setattr(messenger_service.settings, "TELEGRAM_BOT_TOKEN", "tok")
    from app.models.store import Store
    from app.models.order import Order

    store = Store(
        owner_id=1,
        name="S",
        slug="s-messenger-free",
        telegram_chat_id="99",
    )
    # Minimal: unit-test payload builder via enqueue with mocked entitlements
    order = MagicMock(spec=Order)
    order.id = 7
    order.invoice_code = "NV-TEST"

    with patch.object(
        entitlement_service,
        "get_seller_entitlements",
        return_value={
            **entitlement_service.DEFAULT_ENTITLEMENTS,
            "messenger_receipt_actions": False,
        },
    ), patch.object(notification_service, "enqueue_messenger") as enq:
        store.owner_id = 1
        messenger_service.enqueue_seller_messenger(
            db, store=store, order=order, kind="receipt"
        )
        assert enq.called
        kwargs = enq.call_args.kwargs
        assert kwargs["payload"]["include_actions"] is False
        assert kwargs["payload"]["photo_url"] == ""


def test_deliver_pending_sms_and_email_with_mocked_providers(db: Session):
    sms = MagicMock()
    email = MagicMock()

    sms_row = notification_service.enqueue_sms(
        db,
        "+989121000001",
        "test_message",
        {"code": "۱۲۳۴"},
    )
    email_row = notification_service.enqueue_email(
        db,
        "seller@example.com",
        "test_message",
        {"code": "۱۲۳۴"},
    )
    db.commit()

    delivered = deliver_pending(
        db,
        notification_ids=[sms_row.id, email_row.id],
        sms_provider=sms,
        email_provider=email,
    )
    assert delivered == 2
    sms.send.assert_called_once()
    email.send.assert_called_once()

    refreshed_sms = db.get(NotificationOutbox, sms_row.id)
    refreshed_email = db.get(NotificationOutbox, email_row.id)
    assert refreshed_sms is not None and refreshed_sms.status == STATUS_SENT
    assert refreshed_email is not None and refreshed_email.status == STATUS_SENT
