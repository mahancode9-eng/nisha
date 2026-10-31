"""Seller-triggered buyer invoice recovery SMS."""

from sqlalchemy import select

from app.models.enums import OrderStatus
from app.models.notification import NotificationOutbox
from app.models.order import Order


def test_seller_can_resend_invoice_link(client, placed_order, public_store, db):
    order_id = placed_order["order_id"]
    res = client.post(
        f"/api/v1/seller/orders/{order_id}/send-invoice-link",
        headers=public_store["seller_headers"],
    )
    assert res.status_code == 200
    assert "فرستاده شد" in res.json()["message"]

    rows = list(
        db.scalars(
            select(NotificationOutbox).where(
                NotificationOutbox.template == "invoice_recovery_buyer"
            )
        ).all()
    )
    assert len(rows) == 1
    assert rows[0].channel == "sms"
    assert placed_order["invoice_code"] in (rows[0].payload_json or "")


def test_recovery_blocked_when_not_open(client, placed_order, public_store, db):
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    order.status = OrderStatus.CANCELLED
    db.commit()

    res = client.post(
        f"/api/v1/seller/orders/{placed_order['order_id']}/send-invoice-link",
        headers=public_store["seller_headers"],
    )
    assert res.status_code == 422
