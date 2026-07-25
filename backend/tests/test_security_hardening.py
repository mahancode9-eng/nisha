"""Wave 1 security hardening tests."""

from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.product import Product
from app.services.private_media_service import (
    create_media_access_token,
    sign_private_media_url,
)
from app.services.reservation_cleanup_service import expire_stale_reservations
from app.services.seller_export_service import _sanitize_csv_cell
from app.schemas.public import GuestOrderCreate


def test_email_verification_invalidates_prior_tokens(client, db):
    from sqlalchemy import select

    from app.models.email_verification import EmailVerificationToken
    from app.models.enums import VerificationAccountKind
    from app.models.user import User
    from app.services.email_verification_service import AuthError, issue_verification, verify_email_token

    client.post(
        "/api/v1/auth/register",
        json={
            "email": "token-rotate@example.com",
            "password": "securepass",
            "full_name": "Token Rotate",
        },
    )
    user = db.scalar(select(User).where(User.email == "token-rotate@example.com"))
    assert user is not None

    first = issue_verification(
        db,
        account_kind=VerificationAccountKind.USER,
        account_id=user.id,
        email=user.email,
        full_name=user.full_name,
    )
    db.commit()
    second = issue_verification(
        db,
        account_kind=VerificationAccountKind.USER,
        account_id=user.id,
        email=user.email,
        full_name=user.full_name,
    )
    db.commit()

    with pytest.raises(AuthError):
        verify_email_token(db, token=first, kind="seller")

    verify_email_token(db, token=second, kind="seller")


def test_reservation_expiry_restores_stock(client, placed_order, db):
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    assert order.status == OrderStatus.PENDING_PAYMENT
    assert order.reservation_expires_at is not None

    product = db.get(Product, order.items[0].product_id)
    stock_after_order = product.stock_quantity

    order.reservation_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    expired = expire_stale_reservations(db)
    assert expired == 1

    db.refresh(order)
    db.refresh(product)
    assert order.status == OrderStatus.EXPIRED
    assert order.stock_restored is True
    assert product.stock_quantity == stock_after_order + order.items[0].quantity

    # Idempotent second run
    assert expire_stale_reservations(db) == 0


def test_guest_checkout_honeypot_rejects_bots():
    with pytest.raises(ValidationError):
        GuestOrderCreate(
            buyer_name="Bot",
            buyer_phone="+989121234567",
            buyer_address="Somewhere",
            payment_method_id=1,
            items=[{"product_id": 1, "quantity": 1}],
            company_website="https://spam.example",
        )


def test_csv_formula_injection_sanitized():
    assert _sanitize_csv_cell("=1+1") == "'=1+1"
    assert _sanitize_csv_cell("+cmd") == "'+cmd"
    assert _sanitize_csv_cell("-2+3") == "'-2+3"
    assert _sanitize_csv_cell("@sum") == "'@sum"
    assert _sanitize_csv_cell("normal") == "normal"
    assert _sanitize_csv_cell(12) == 12


def test_production_rejects_console_email(monkeypatch):
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://x",
            JWT_SECRET_KEY="x" * 40,
            EMAIL_PROVIDER="console",
            FRONTEND_BASE_URL="https://nisha.example",
        )


def test_production_rejects_localhost_frontend():
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql://x",
            JWT_SECRET_KEY="x" * 40,
            EMAIL_PROVIDER="resend",
            EMAIL_FROM="noreply@example.com",
            RESEND_API_KEY="re_test",
            FRONTEND_BASE_URL="http://localhost:3000",
        )


def test_sign_private_media_url_leaves_public_paths():
    assert sign_private_media_url("/uploads/products/a.jpg") == "/uploads/products/a.jpg"
    signed = sign_private_media_url("/api/v1/media/private/payment-proofs/a.jpg")
    assert signed.startswith("/api/v1/media/private/payment-proofs/a.jpg?token=")
    token = create_media_access_token("payment-proofs/a.jpg")
    assert isinstance(token, str) and len(token) > 20


def test_placed_order_has_reservation_window(client, placed_order, db):
    order = db.get(Order, placed_order["order_id"])
    assert order.reservation_expires_at is not None
    expires = order.reservation_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    assert expires > datetime.now(timezone.utc)
