from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services import entitlement_service
from app.services.payments import get_payment_provider

PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _seller_user_id(db: Session, email: str = "seller-a@example.com") -> int:
    from sqlalchemy import select

    from app.models.user import User
    from app.services.auth_service import normalize_email

    user = db.scalar(select(User).where(User.email == normalize_email(email)))
    assert user is not None
    return user.id


def test_default_free_subscription_and_plans(client: TestClient, seller_headers: dict[str, str], db: Session):
    plans = client.get("/api/v1/seller/plans", headers=seller_headers)
    assert plans.status_code == 200
    codes = {p["code"] for p in plans.json()}
    assert {"free", "basic", "pro", "enterprise"} <= codes
    assert any(p["is_recommended"] for p in plans.json())

    detail = client.get("/api/v1/seller/subscription", headers=seller_headers)
    assert detail.status_code == 200
    body = detail.json()
    assert body["effective_plan"]["code"] == "free"
    assert body["entitlements"]["discounts"] is False


def test_checkout_yearly_amount_and_card_provider(
    client: TestClient,
    seller_headers: dict[str, str],
    admin_headers: dict[str, str],
    db: Session,
):
    client.patch(
        "/api/v1/admin/settings",
        headers=admin_headers,
        json={
            "subscription_card_number": "6037999999999999",
            "subscription_card_owner": "Nisha",
            "subscription_card_bank": "Test Bank",
        },
    )

    provider = get_payment_provider()
    assert provider.name == "card_to_card"

    response = client.post(
        "/api/v1/seller/subscription/checkout",
        headers=seller_headers,
        json={"plan_code": "pro", "period": "YEARLY"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["invoice"]["amount_toman"] == 5_990_000
    assert body["invoice"]["period"] == "YEARLY"
    assert body["payment"]["provider"] == "card_to_card"
    assert body["card_instructions"]["card_number"] == "6037999999999999"


def test_checkout_quarterly_amount_and_confirm_extends_three_months(
    client: TestClient,
    seller_headers: dict[str, str],
    admin_headers: dict[str, str],
    db: Session,
):
    from datetime import datetime, timezone

    response = client.post(
        "/api/v1/seller/subscription/checkout",
        headers=seller_headers,
        json={"plan_code": "pro", "period": "QUARTERLY"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["invoice"]["amount_toman"] == 1_617_000
    assert body["invoice"]["period"] == "QUARTERLY"
    invoice_id = body["invoice"]["id"]

    upload = client.post(
        f"/api/v1/seller/subscription/invoices/{invoice_id}/proof",
        headers=seller_headers,
        files={"file": ("receipt.png", PNG_BYTES, "image/png")},
    )
    assert upload.status_code == 200

    before = datetime.now(timezone.utc)
    confirm = client.post(
        f"/api/v1/admin/subscriptions/invoices/{invoice_id}/confirm",
        headers=admin_headers,
        json={"admin_note": "quarterly ok"},
    )
    assert confirm.status_code == 200

    detail = client.get("/api/v1/seller/subscription", headers=seller_headers)
    assert detail.status_code == 200
    end_raw = detail.json()["subscription"]["current_period_end"]
    end = datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    delta_days = (end - before).days
    assert 85 <= delta_days <= 95


def test_checkout_proof_admin_confirm_activates_plan(
    client: TestClient,
    seller_headers: dict[str, str],
    admin_headers: dict[str, str],
    db: Session,
):
    checkout = client.post(
        "/api/v1/seller/subscription/checkout",
        headers=seller_headers,
        json={"plan_code": "basic", "period": "MONTHLY"},
    )
    assert checkout.status_code == 200
    invoice_id = checkout.json()["invoice"]["id"]
    assert checkout.json()["invoice"]["amount_toman"] == 299_000

    upload = client.post(
        f"/api/v1/seller/subscription/invoices/{invoice_id}/proof",
        headers=seller_headers,
        files={"file": ("receipt.png", PNG_BYTES, "image/png")},
    )
    assert upload.status_code == 200
    assert upload.json()["status"] == "PROOF_UPLOADED"

    confirm = client.post(
        f"/api/v1/admin/subscriptions/invoices/{invoice_id}/confirm",
        headers=admin_headers,
        json={"admin_note": "ok"},
    )
    assert confirm.status_code == 200
    assert confirm.json()["status"] == "PAID"

    detail = client.get("/api/v1/seller/subscription", headers=seller_headers)
    assert detail.status_code == 200
    assert detail.json()["effective_plan"]["code"] == "basic"
    assert detail.json()["entitlements"]["discounts"] is True


def test_admin_reject_leaves_plan_unchanged(
    client: TestClient,
    seller_headers: dict[str, str],
    admin_headers: dict[str, str],
    db: Session,
):
    checkout = client.post(
        "/api/v1/seller/subscription/checkout",
        headers=seller_headers,
        json={"plan_code": "pro", "period": "MONTHLY"},
    )
    invoice_id = checkout.json()["invoice"]["id"]
    client.post(
        f"/api/v1/seller/subscription/invoices/{invoice_id}/proof",
        headers=seller_headers,
        files={"file": ("receipt.png", PNG_BYTES, "image/png")},
    )
    reject = client.post(
        f"/api/v1/admin/subscriptions/invoices/{invoice_id}/reject",
        headers=admin_headers,
        json={"admin_note": "invalid"},
    )
    assert reject.status_code == 200
    assert reject.json()["status"] == "REJECTED"

    detail = client.get("/api/v1/seller/subscription", headers=seller_headers)
    assert detail.json()["effective_plan"]["code"] == "free"


def test_free_plan_cannot_create_discount(client: TestClient, seller_headers: dict[str, str]):
    response = client.post(
        "/api/v1/seller/discounts",
        headers=seller_headers,
        json={
            "code": "SAVE10",
            "discount_type": "PERCENT",
            "percent_off": "10",
            "is_active": True,
        },
    )
    assert response.status_code == 403


def test_product_cap_on_free_plan(client: TestClient, seller_headers: dict[str, str], db: Session):
    seller_id = _seller_user_id(db)
    entitlements = entitlement_service.get_seller_entitlements(db, seller_id)
    max_products = entitlement_service.get_max_products(entitlements)
    assert max_products == 30

    free = entitlement_service.get_free_plan(db)
    free.set_entitlements({**free.entitlements, "max_products": 1})
    db.commit()

    first = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "One",
            "price": "10",
            "stock_quantity": 1,
            "is_active": True,
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "Two",
            "price": "10",
            "stock_quantity": 1,
            "is_active": True,
        },
    )
    assert second.status_code == 403
