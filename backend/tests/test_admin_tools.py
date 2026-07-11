from sqlalchemy import select

from app.models.enums import ComplaintStatus, OrderStatus
from app.models.order import Order
from app.models.store import Store


from tests.conftest import mark_customer_email_verified


def register_customer(client, db, **overrides):
    payload = {
        "email": "tools-buyer@example.com",
        "phone": "+989125555555",
        "postal_code": "1234567890",
        "password": "securepass",
        "full_name": "Tools Buyer",
    }
    payload.update(overrides)
    response = client.post("/api/v1/customer/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    if data.get("needs_email_verification") and payload.get("email"):
        mark_customer_email_verified(db, payload["email"])
        login = client.post(
            "/api/v1/customer/login",
            json={"login": payload["email"], "password": payload["password"]},
        )
        assert login.status_code == 200
        return login.json()
    return data


def create_complaint(client, placed_order, db):
    order = db.get(Order, placed_order["order_id"])
    order.status = OrderStatus.SHIPPED
    db.commit()

    token = register_customer(client, db)
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    claim = client.post(
        "/api/v1/customer/orders/claim",
        headers=headers,
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_password": placed_order["password"],
        },
    )
    assert claim.status_code == 200

    complaint = client.post(
        f"/api/v1/customer/orders/{placed_order['order_id']}/complaints",
        headers=headers,
        json={"reason": "NON_DELIVERY", "message": "Package has not arrived."},
    )
    assert complaint.status_code == 200
    return complaint.json()


def test_admin_can_list_and_update_complaints(client, placed_order, db, admin_headers):
    create_complaint(client, placed_order, db)

    listing = client.get("/api/v1/admin/complaints", headers=admin_headers)
    assert listing.status_code == 200
    payload = listing.json()
    assert payload["total"] == 1
    item = payload["items"][0]
    assert item["order_id"] == placed_order["order_id"]
    assert item["invoice_code"] == placed_order["invoice_code"]
    assert item["store_slug"] == placed_order["slug"]
    assert item["status"] == ComplaintStatus.OPEN.value

    updated = client.patch(
        f"/api/v1/admin/complaints/{item['id']}",
        headers=admin_headers,
        json={
            "status": ComplaintStatus.IN_REVIEW.value,
            "note": "Checking with the seller",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == ComplaintStatus.IN_REVIEW.value

    open_only = client.get(
        "/api/v1/admin/complaints",
        headers=admin_headers,
        params={"status": ComplaintStatus.OPEN.value},
    )
    assert open_only.status_code == 200
    assert open_only.json()["total"] == 0

    in_review = client.get(
        "/api/v1/admin/complaints",
        headers=admin_headers,
        params={"status": ComplaintStatus.IN_REVIEW.value},
    )
    assert in_review.status_code == 200
    assert in_review.json()["total"] == 1


def test_admin_complaints_require_admin_role(client, placed_order, db, seller_headers):
    create_complaint(client, placed_order, db)

    response = client.get("/api/v1/admin/complaints", headers=seller_headers)
    assert response.status_code == 403


def test_update_missing_complaint_returns_404(client, admin_headers):
    response = client.patch(
        "/api/v1/admin/complaints/999999",
        headers=admin_headers,
        json={"status": ComplaintStatus.RESOLVED.value},
    )
    assert response.status_code == 404


def test_admin_can_impersonate_store_owner(client, public_store, db, admin_headers):
    store = db.scalar(select(Store).where(Store.slug == public_store["slug"]))
    assert store is not None

    response = client.post(
        f"/api/v1/admin/stores/{store.id}/impersonate",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == "seller-a@example.com"

    impersonated_headers = {"Authorization": f"Bearer {data['access_token']}"}
    dashboard = client.get("/api/v1/seller/dashboard", headers=impersonated_headers)
    assert dashboard.status_code == 200


def test_impersonate_unknown_store_returns_404(client, admin_headers):
    response = client.post(
        "/api/v1/admin/stores/999999/impersonate",
        headers=admin_headers,
    )
    assert response.status_code == 404


def test_impersonate_requires_admin_role(client, public_store, db, seller_headers):
    store = db.scalar(select(Store).where(Store.slug == public_store["slug"]))
    assert store is not None

    response = client.post(
        f"/api/v1/admin/stores/{store.id}/impersonate",
        headers=seller_headers,
    )
    assert response.status_code == 403
