"""Payment-proof OCR match + upload spam cap."""

from decimal import Decimal
from unittest.mock import patch

from app.models.enums import OrderStatus
from app.models.order import Order
from app.services.payment_proof_ocr_service import (
    OCR_MATCHED,
    OCR_MISMATCH,
    OCR_UNCLEAR,
    extract_amounts,
    extract_card_last4s,
    match_order_to_ocr_text,
)


PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_extract_persian_amount_and_card():
    text = "واریز مبلغ ۱۸۹۸۷۵ ریال به کارت ۶۰۳۷-۹۹۱۲-۳۴۵۶-۷۸۹۰"
    amounts = extract_amounts(text)
    assert Decimal("189875") in amounts
    assert "7890" in extract_card_last4s(text)


def test_match_order_amount_and_dest(db, placed_order):
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    order.total_amount = Decimal("189875")
    if order.payment_method is not None:
        order.payment_method.card_number = "6037991234567890"
    db.commit()
    db.refresh(order)

    text = "مبلغ ۱۸۹۸۷۵ تومان کارت مقصد 6037-9912-3456-7890"
    result = match_order_to_ocr_text(order, text)
    assert result.status == OCR_MATCHED
    assert result.amount_matched is True
    assert result.dest_card_matched is True


def test_match_mismatch_wrong_amount(db, placed_order):
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    order.total_amount = Decimal("189875")
    if order.payment_method is not None:
        order.payment_method.card_number = "6037991234567890"
    db.commit()
    db.refresh(order)

    text = "مبلغ 1000 تومان کارت 6037991234567890"
    result = match_order_to_ocr_text(order, text)
    assert result.status == OCR_MISMATCH
    assert result.amount_matched is False


def test_upload_sets_ocr_matched(client, placed_order, db):
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    order.total_amount = Decimal("250000")
    if order.payment_method is not None:
        order.payment_method.card_number = "6037991111222233"
    db.commit()

    fake_text = "انتقال 250000 ریال به 6037-9911-1122-2233"

    with patch(
        "app.services.payment_proof_ocr_service.extract_text_from_image",
        return_value=fake_text,
    ):
        res = client.post(
            f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
            data={"invoice_edit_password": placed_order["password"]},
            files={"file": ("proof.png", PNG_BYTES, "image/png")},
        )

    assert res.status_code == 200
    proof = res.json()["proof"]
    assert proof["ocr_status"] == OCR_MATCHED
    assert proof["ocr_amount_matched"] is True
    assert proof["ocr_dest_card_matched"] is True


def test_upload_caps_proof_spam(client, placed_order, monkeypatch, db):
    from app.core import config

    monkeypatch.setattr(config.settings, "PAYMENT_PROOF_MAX_PER_ORDER", 2)
    monkeypatch.setattr(config.settings, "PAYMENT_PROOF_OCR_ENABLED", False)

    for _ in range(2):
        ok = client.post(
            f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
            data={"invoice_edit_password": placed_order["password"]},
            files={"file": ("proof.png", PNG_BYTES, "image/png")},
        )
        assert ok.status_code == 200

    blocked = client.post(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
        data={"invoice_edit_password": placed_order["password"]},
        files={"file": ("proof.png", PNG_BYTES, "image/png")},
    )
    assert blocked.status_code == 422
    assert "رسید" in blocked.json()["detail"]

    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    assert order.status == OrderStatus.PAYMENT_UPLOADED
    assert len(order.payment_proofs) == 2
    assert all(p.ocr_status in {"skipped", "unclear", "failed", "pending"} for p in order.payment_proofs)


def test_unclear_when_no_digits():
    class _FakeOrder:
        total_amount = Decimal("1000")
        payment_method = None

    result = match_order_to_ocr_text(_FakeOrder(), "رسید بانکی بدون عدد")  # type: ignore[arg-type]
    assert result.status == OCR_UNCLEAR
