"""Tests for order lifecycle notifications (roadmap task 12)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import OrderStatus
from app.models.notification import NotificationOutbox
from app.models.order import Order
from app.services import order_access_service


def _outbox_rows(db: Session) -> list[NotificationOutbox]:
    return list(
        db.scalars(select(NotificationOutbox).order_by(NotificationOutbox.id)).all()
    )


def test_order_placement_enqueues_buyer_sms_and_seller_email(
    db: Session, placed_order: dict
) -> None:
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    seller_email = order.store.owner.email
    rows = _outbox_rows(db)

    buyer_sms = [r for r in rows if r.template == "order_placed_buyer"]
    assert len(buyer_sms) == 1
    assert buyer_sms[0].channel == "sms"
    assert buyer_sms[0].recipient == order.buyer_phone
    assert buyer_sms[0].status == "pending"
    assert order.invoice_code in (buyer_sms[0].payload_json or "")
    assert placed_order["password"] in (buyer_sms[0].payload_json or "")
    assert "invoice_password" in (buyer_sms[0].payload_json or "")

    seller_mail = [r for r in rows if r.template == "order_placed_seller"]
    assert len(seller_mail) == 1
    assert seller_mail[0].channel == "email"
    assert seller_mail[0].recipient == seller_email


def test_status_change_enqueues_buyer_sms(db: Session, placed_order: dict) -> None:
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    old_status = order.status
    order.status = OrderStatus.PAYMENT_CONFIRMED
    order_access_service.append_status_history(
        db,
        order=order,
        old_status=old_status,
        new_status=OrderStatus.PAYMENT_CONFIRMED,
    )
    db.commit()

    rows = [r for r in _outbox_rows(db) if r.template == "order_status_changed"]
    assert len(rows) == 1
    assert rows[0].channel == "sms"
    assert rows[0].recipient == order.buyer_phone
    assert "پرداخت تایید شد" in (rows[0].payload_json or "")


def test_payment_uploaded_notifies_seller_by_email(
    db: Session, placed_order: dict
) -> None:
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    seller_email = order.store.owner.email
    order_access_service.append_status_history(
        db,
        order=order,
        old_status=order.status,
        new_status=OrderStatus.PAYMENT_UPLOADED,
    )
    db.commit()

    rows = [r for r in _outbox_rows(db) if r.template == "payment_uploaded_seller"]
    assert len(rows) == 1
    assert rows[0].channel == "email"
    assert rows[0].recipient == seller_email
