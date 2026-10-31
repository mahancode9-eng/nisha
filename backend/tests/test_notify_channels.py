"""Optional buyer email + seller SMS notify prefs."""

from sqlalchemy import select

from app.models.notification import NotificationOutbox
from app.models.store import Store


def test_checkout_enqueues_buyer_email(client, public_store, db):
    product_id = public_store["product_id"]
    payment_id = public_store["payment_method_id"]
    res = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Buyer",
            "buyer_phone": "+989121111111",
            "buyer_email": "buyer-notify@example.com",
            "notify_sms": True,
            "buyer_address": "Tehran",
            "payment_method_id": payment_id,
            "items": [{"product_id": product_id, "quantity": 1}],
        },
    )
    assert res.status_code == 201

    emails = list(
        db.scalars(
            select(NotificationOutbox).where(
                NotificationOutbox.channel == "email",
                NotificationOutbox.template == "order_placed_buyer",
            )
        ).all()
    )
    assert any("buyer-notify@example.com" in (r.recipient or "") for r in emails)


def test_checkout_can_skip_buyer_sms(client, public_store, db):
    product_id = public_store["product_id"]
    payment_id = public_store["payment_method_id"]
    res = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Buyer",
            "buyer_phone": "+989121111112",
            "buyer_email": "only-email@example.com",
            "notify_sms": False,
            "buyer_address": "Tehran",
            "payment_method_id": payment_id,
            "items": [{"product_id": product_id, "quantity": 1}],
        },
    )
    assert res.status_code == 201
    sms = list(
        db.scalars(
            select(NotificationOutbox).where(
                NotificationOutbox.channel == "sms",
                NotificationOutbox.template == "order_placed_buyer",
            )
        ).all()
    )
    assert not any("+989121111112" in (r.recipient or "") for r in sms)


def test_seller_can_enable_sms_notify(client, public_store, db):
    res = client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={
            "notify_by_sms": True,
            "notify_sms_phone": "09121234567",
            "notify_by_email": True,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["notify_by_sms"] is True
    assert body["notify_sms_phone"] == "09121234567"

    store = db.get(Store, body["id"])
    assert store is not None
    assert store.notify_by_sms is True
    assert store.notify_sms_phone == "09121234567"
