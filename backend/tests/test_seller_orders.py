from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.product import Product


def _place_order(client, public_store, quantity=2):
    return client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Buyer",
            "buyer_phone": "+989120000000",
            "buyer_address": "Address",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": quantity}],
        },
    )


def test_seller_sees_only_own_orders(client, public_store, other_seller_headers):
    _place_order(client, public_store)

    own = client.get("/api/v1/seller/orders", headers=public_store["seller_headers"])
    other = client.get("/api/v1/seller/orders", headers=other_seller_headers)

    assert own.status_code == 200
    assert own.json()["total"] == 1
    assert other.status_code == 200
    assert other.json()["total"] == 0


def test_cannot_access_other_seller_order(
    client,
    public_store,
    other_seller_headers,
    placed_order,
):
    response = client.get(
        f"/api/v1/seller/orders/{placed_order['order_id']}",
        headers=other_seller_headers,
    )
    assert response.status_code == 404


def test_confirm_payment(client, public_store, placed_order):
    response = client.post(
        f"/api/v1/seller/orders/{placed_order['order_id']}/confirm-payment",
        headers=public_store["seller_headers"],
    )

    assert response.status_code == 200
    assert response.json()["status"] == "PAYMENT_CONFIRMED"


def test_reject_payment_restores_stock(client, public_store, db):
    checkout = _place_order(client, public_store, quantity=3)
    order_id = checkout.json()["order_id"]

    product = db.get(Product, public_store["product_id"])
    stock_after_order = product.stock_quantity

    response = client.post(
        f"/api/v1/seller/orders/{order_id}/reject-payment",
        headers=public_store["seller_headers"],
    )

    assert response.status_code == 200
    db.refresh(product)
    assert product.stock_quantity == stock_after_order + 3

    order = db.get(Order, order_id)
    assert order.stock_restored is True


def test_cancel_restores_stock(client, public_store, db):
    checkout = _place_order(client, public_store, quantity=2)
    order_id = checkout.json()["order_id"]

    client.post(
        f"/api/v1/seller/orders/{order_id}/confirm-payment",
        headers=public_store["seller_headers"],
    )

    product = db.get(Product, public_store["product_id"])
    stock_after_confirm = product.stock_quantity

    cancel = client.patch(
        f"/api/v1/seller/orders/{order_id}/status",
        headers=public_store["seller_headers"],
        json={"status": "CANCELLED"},
    )
    assert cancel.status_code == 200

    db.refresh(product)
    assert product.stock_quantity == stock_after_confirm + 2


def test_stock_not_restored_twice(client, public_store, db):
    checkout = _place_order(client, public_store, quantity=2)
    order_id = checkout.json()["order_id"]

    client.post(
        f"/api/v1/seller/orders/{order_id}/reject-payment",
        headers=public_store["seller_headers"],
    )

    product = db.get(Product, public_store["product_id"])
    stock_after_reject = product.stock_quantity

    order = db.get(Order, order_id)
    assert order.stock_restored is True

    restored_again = client.post(
        f"/api/v1/seller/orders/{order_id}/reject-payment",
        headers=public_store["seller_headers"],
    )
    assert restored_again.status_code == 422

    db.refresh(product)
    assert product.stock_quantity == stock_after_reject


def test_dashboard_metrics(client, public_store, db):
    checkout = _place_order(client, public_store, quantity=1)
    order_id = checkout.json()["order_id"]

    client.post(
        f"/api/v1/seller/orders/{order_id}/confirm-payment",
        headers=public_store["seller_headers"],
    )

    client.put(
        f"/api/v1/seller/products/{public_store['product_id']}",
        headers=public_store["seller_headers"],
        json={"stock_quantity": 2},
    )

    response = client.get("/api/v1/seller/dashboard", headers=public_store["seller_headers"])
    assert response.status_code == 200
    data = response.json()

    assert data["total_orders"] == 1
    assert data["confirmed_orders"] == 1
    assert data["confirmed_revenue"] == "49.99"
    assert len(data["low_stock_products"]) >= 1
    assert len(data["recent_orders"]) == 1
