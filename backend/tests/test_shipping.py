from decimal import Decimal

from app.services.shipping_service import ShippingLineInput, compute_shipping_amount


def test_compute_shipping_store_flat_rate():
    amount = compute_shipping_amount(
        subtotal=Decimal("100000"),
        default_shipping_cost=Decimal("50000"),
        free_shipping_min_subtotal=None,
        lines=[ShippingLineInput(product_id=1, quantity=1, shipping_cost=None)],
    )
    assert amount == Decimal("50000")


def test_compute_shipping_free_over_threshold():
    amount = compute_shipping_amount(
        subtotal=Decimal("500000"),
        default_shipping_cost=Decimal("50000"),
        free_shipping_min_subtotal=Decimal("500000"),
        lines=[ShippingLineInput(product_id=1, quantity=1, shipping_cost=None)],
    )
    assert amount == Decimal("0")


def test_compute_shipping_product_override_replaces_store_fee():
    amount = compute_shipping_amount(
        subtotal=Decimal("100000"),
        default_shipping_cost=Decimal("50000"),
        free_shipping_min_subtotal=None,
        lines=[ShippingLineInput(product_id=1, quantity=2, shipping_cost=Decimal("100000"))],
    )
    assert amount == Decimal("200000")


def test_guest_checkout_applies_store_shipping(client, public_store):
    update = client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"default_shipping_cost": "50000"},
    )
    assert update.status_code == 200

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Ali Customer",
            "buyer_phone": "+989121111111",
            "buyer_address": "Tehran, Iran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 2}],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["subtotal_amount"] == "99.98"
    assert float(data["shipping_amount"]) == 50000
    assert float(data["total_amount"]) == 50099.98


def test_guest_checkout_free_shipping_over_threshold(client, public_store):
    client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={
            "default_shipping_cost": "50000",
            "free_shipping_min_subtotal": "50",
        },
    )

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Ali Customer",
            "buyer_phone": "+989121111111",
            "buyer_address": "Tehran, Iran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 2}],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert float(data["shipping_amount"]) == 0
    assert data["total_amount"] == "99.98"


def test_guest_checkout_product_shipping_override(client, public_store):
    client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"default_shipping_cost": "50000"},
    )
    product_update = client.put(
        f"/api/v1/seller/products/{public_store['product_id']}",
        headers=public_store["seller_headers"],
        json={"shipping_cost": "100000"},
    )
    assert product_update.status_code == 200

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Ali Customer",
            "buyer_phone": "+989121111111",
            "buyer_address": "Tehran, Iran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 2}],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert float(data["shipping_amount"]) == 200000
    assert float(data["total_amount"]) == 200099.98
