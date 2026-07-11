import json
from datetime import datetime, timezone

from sqlalchemy import func, select

from app.models.customer_account import CustomerAccount
from app.models.email_verification import EmailVerificationToken
from app.models.enums import VerificationAccountKind
from app.models.notification import NotificationOutbox
from app.services.notification_service import TEMPLATES
from app.models.user import User
from tests.conftest import mark_customer_email_verified, mark_user_email_verified


def test_customer_register_requires_verification(client, db):
    response = client.post(
        "/api/v1/customer/register",
        json={
            "email": "verify-me@example.com",
            "password": "securepass",
            "full_name": "Verify Me",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["needs_email_verification"] is True
    assert data["email"] == "verify-me@example.com"
    assert data.get("access_token") is None

    outbox = db.scalars(select(NotificationOutbox)).all()
    assert len(outbox) == 1
    assert outbox[0].template == "email_verification"
    payload = json.loads(outbox[0].payload_json)
    assert "verify_link" in payload

    template = TEMPLATES["email_verification"]
    subject = template.email_subject.format(**payload)
    assert subject == "تأیید ایمیل نیشا"
    assert "\\u062" not in subject

    login = client.post(
        "/api/v1/customer/login",
        json={"login": "verify-me@example.com", "password": "securepass"},
    )
    assert login.status_code == 403


def test_customer_phone_register_skips_verification(client):
    response = client.post(
        "/api/v1/customer/register",
        json={
            "phone": "+989120000001",
            "password": "securepass",
            "full_name": "Phone Only",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["needs_email_verification"] is False
    assert data["access_token"]


def test_verify_customer_email_via_token(client, db):
    client.post(
        "/api/v1/customer/register",
        json={
            "email": "token-verify@example.com",
            "password": "securepass",
            "full_name": "Token Verify",
        },
    )
    token_row = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.account_kind == VerificationAccountKind.CUSTOMER
        )
    )
    assert token_row is not None

    from app.services.email_verification_service import issue_verification

    customer = db.scalar(
        select(CustomerAccount).where(CustomerAccount.email == "token-verify@example.com")
    )
    raw = issue_verification(
        db,
        account_kind=VerificationAccountKind.CUSTOMER,
        account_id=customer.id,
        email=customer.email,
        full_name=customer.full_name,
    )
    db.commit()

    verify = client.post(
        "/api/v1/public/verify-email",
        json={"token": raw, "kind": "customer"},
    )
    assert verify.status_code == 200
    db.refresh(customer)
    assert customer.email_verified_at is not None

    login = client.post(
        "/api/v1/customer/login",
        json={"login": "token-verify@example.com", "password": "securepass"},
    )
    assert login.status_code == 200


def test_seller_register_requires_verification(client, db):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "seller-verify@example.com",
            "password": "securepass",
            "full_name": "Seller Verify",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["needs_email_verification"] is True
    assert data.get("access_token") is None

    mark_user_email_verified(db, "seller-verify@example.com")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "seller-verify@example.com", "password": "securepass"},
    )
    assert login.status_code == 200


def test_resend_verification_is_generic(client, db):
    client.post(
        "/api/v1/customer/register",
        json={
            "email": "resend@example.com",
            "password": "securepass",
            "full_name": "Resend User",
        },
    )
    response = client.post(
        "/api/v1/public/verify-email/resend",
        json={"email": "resend@example.com", "kind": "customer"},
    )
    assert response.status_code == 200
    assert response.json()["sent"] is True

    missing = client.post(
        "/api/v1/public/verify-email/resend",
        json={"email": "missing@example.com", "kind": "customer"},
    )
    assert missing.status_code == 200


def test_customer_reregister_unverified_email(client, db):
    payload = {
        "email": "reregister@example.com",
        "password": "securepass",
        "full_name": "First Try",
    }
    first = client.post("/api/v1/customer/register", json=payload)
    second = client.post(
        "/api/v1/customer/register",
        json={**payload, "password": "newsecurepass", "full_name": "Second Try"},
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["needs_email_verification"] is True

    customer = db.scalar(
        select(CustomerAccount).where(CustomerAccount.email == "reregister@example.com")
    )
    assert customer is not None
    assert customer.full_name == "Second Try"

    outbox_count = db.scalar(select(func.count()).select_from(NotificationOutbox)) or 0
    assert outbox_count == 2


def test_customer_reregister_verified_email_rejected(client, db):
    payload = {
        "email": "verified-customer@example.com",
        "password": "securepass",
        "full_name": "Verified Customer",
    }
    first = client.post("/api/v1/customer/register", json=payload)
    mark_customer_email_verified(db, "verified-customer@example.com")
    second = client.post("/api/v1/customer/register", json=payload)
    assert first.status_code == 201
    assert second.status_code == 409


def test_issue_verification_attempts_immediate_delivery(client, monkeypatch, db):
    from unittest.mock import MagicMock

    deliver = MagicMock(return_value=1)
    monkeypatch.setattr(
        "app.services.email_verification_service.deliver_pending",
        deliver,
    )
    client.post(
        "/api/v1/customer/register",
        json={
            "email": "immediate@example.com",
            "password": "securepass",
            "full_name": "Immediate Send",
        },
    )
    assert deliver.call_count >= 1
    _, kwargs = deliver.call_args
    assert kwargs.get("limit") == 1
    assert kwargs.get("notification_ids")
