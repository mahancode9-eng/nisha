from app.core.security import verify_password
from app.models.order import Order


def _order_payload(public_store: dict, *, quantity: int = 2) -> dict:
    return {
        "buyer_name": "Ali Customer",
        "buyer_phone": "+989121111111",
        "buyer_address": "Tehran, Iran",
        "buyer_note": "Please call before delivery",
        "payment_method_id": public_store["payment_method_id"],
        "items": [{"product_id": public_store["product_id"], "quantity": quantity}],
    }


def test_successful_guest_order(client, public_store, db):
    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["invoice_code"].startswith("NV-")
    assert data["invoice_edit_password"]
    assert data["status"] == "PENDING_PAYMENT"
    assert data["total_amount"] == "99.98"
    assert len(data["items"]) == 1
    assert data["payment_method"]["display_name"] == "Bank Transfer"

    order = db.get(Order, data["order_id"])
    assert order is not None
    assert verify_password(data["invoice_edit_password"], order.invoice_password_hash)


def test_stock_decreases_after_order(client, public_store):
    before = client.get(f"/api/v1/public/stores/{public_store['slug']}/products")
    stock_before = before.json()[0]["stock_quantity"]

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store, quantity=3),
    )
    assert response.status_code == 201

    after = client.get(f"/api/v1/public/stores/{public_store['slug']}/products")
    stock_after = after.json()[0]["stock_quantity"]
    assert stock_after == stock_before - 3


def test_insufficient_stock(client, public_store):
    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store, quantity=999),
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "موجودی برای این مورد کافی نیست: Public Hoodie"


def test_inactive_product(client, public_store):
    deactivate = client.put(
        f"/api/v1/seller/products/{public_store['product_id']}",
        headers=public_store["seller_headers"],
        json={"is_active": False},
    )
    assert deactivate.status_code == 200

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )
    assert response.status_code == 422


def test_inactive_store(client, public_store):
    client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"is_active": False},
    )

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )
    assert response.status_code == 404


def test_wrong_store_payment_method(client, public_store, other_seller_headers):
    other_payment = client.post(
        "/api/v1/seller/payment-methods",
        headers=other_seller_headers,
        json={
            "type": "CRYPTO",
            "display_name": "USDT",
            "wallet_address": "0xABC123",
        },
    )
    assert other_payment.status_code == 201

    payload = _order_payload(public_store)
    payload["payment_method_id"] = other_payment.json()["id"]

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=payload,
    )
    assert response.status_code == 404
