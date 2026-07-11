import json

from sqlalchemy import select

from app.models.notification import NotificationOutbox
from tests.conftest import register_seller


def test_user_recovery_flow(client, db):
    register_seller(client, db, email="recovery-seller@example.com", full_name="Recovery Seller")

    request = client.post(
        "/api/v1/auth/password-recovery/request",
        json={"email": "recovery-seller@example.com"},
    )
    assert request.status_code == 200
    data = request.json()
    assert data["debug_code"]

    outbox = db.scalars(
        select(NotificationOutbox).where(NotificationOutbox.template == "password_recovery_code")
    ).all()
    assert len(outbox) >= 1
    payload = json.loads(outbox[-1].payload_json)
    assert payload["code"] == data["debug_code"]

    verify = client.post(
        "/api/v1/auth/password-recovery/verify",
        json={
            "recovery_id": data["recovery_id"],
            "code": data["debug_code"],
            "new_password": "newsecurepass",
        },
    )
    assert verify.status_code == 200
    assert verify.json()["access_token"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "recovery-seller@example.com", "password": "newsecurepass"},
    )
    assert login.status_code == 200


def test_customer_recovery_enqueues_notification(client, db):
    from tests.conftest import mark_customer_email_verified

    client.post(
        "/api/v1/customer/register",
        json={
            "email": "recovery-buyer@example.com",
            "password": "securepass",
            "full_name": "Recovery Buyer",
        },
    )
    mark_customer_email_verified(db, "recovery-buyer@example.com")

    request = client.post(
        "/api/v1/customer/password-recovery/request",
        json={"login": "recovery-buyer@example.com", "channel": "EMAIL"},
    )
    assert request.status_code == 200
    data = request.json()

    outbox = db.scalars(
        select(NotificationOutbox).where(NotificationOutbox.template == "password_recovery_code")
    ).all()
    assert len(outbox) >= 1
    payload = json.loads(outbox[-1].payload_json)
    assert payload["code"] == data["debug_code"]
