from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.product import Product


def _place_order(client, public_store, quantity=1):
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


def test_cancel_while_payment_pending(client, public_store, db):
    checkout = _place_order(client, public_store, quantity=2)
    order_id = checkout.json()["order_id"]

    product = db.get(Product, public_store["product_id"])
    stock_after_order = product.stock_quantity

    cancel = client.patch(
        f"/api/v1/seller/orders/{order_id}/status",
        headers=public_store["seller_headers"],
        json={"status": "CANCELLED"},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"

    db.refresh(product)
    assert product.stock_quantity == stock_after_order + 2


def test_cancel_while_payment_uploaded(client, public_store, db):
    checkout = _place_order(client, public_store, quantity=1)
    body = checkout.json()
    order_id = body["order_id"]

    order = db.get(Order, order_id)
    order.status = OrderStatus.PAYMENT_UPLOADED
    db.commit()

    cancel = client.patch(
        f"/api/v1/seller/orders/{order_id}/status",
        headers=public_store["seller_headers"],
        json={"status": "CANCELLED"},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"


def test_seller_sets_tracking_code_visible_on_track(client, public_store, db):
    checkout = _place_order(client, public_store)
    body = checkout.json()
    order_id = body["order_id"]
    invoice_code = body["invoice_code"]
    password = body["invoice_edit_password"]

    early = client.patch(
        f"/api/v1/seller/orders/{order_id}/tracking",
        headers=public_store["seller_headers"],
        json={"tracking_code": "123456789012345678901234"},
    )
    assert early.status_code == 422

    confirm = client.post(
        f"/api/v1/seller/orders/{order_id}/confirm-payment",
        headers=public_store["seller_headers"],
    )
    assert confirm.status_code == 200

    tracking = client.patch(
        f"/api/v1/seller/orders/{order_id}/tracking",
        headers=public_store["seller_headers"],
        json={"tracking_code": " 123456789012345678901234 "},
    )
    assert tracking.status_code == 200
    assert tracking.json()["tracking_code"] == "123456789012345678901234"

    order = db.get(Order, order_id)
    assert order.tracking_code == "123456789012345678901234"
    assert order.status == OrderStatus.PAYMENT_CONFIRMED

    tracked = client.post(
        "/api/v1/public/orders/track",
        json={"invoice_code": invoice_code, "invoice_edit_password": password},
    )
    assert tracked.status_code == 200
    assert tracked.json()["tracking_code"] == "123456789012345678901234"


def test_shipped_status_can_include_tracking_code(client, public_store):
    checkout = _place_order(client, public_store)
    order_id = checkout.json()["order_id"]
    headers = public_store["seller_headers"]

    assert (
        client.post(
            f"/api/v1/seller/orders/{order_id}/confirm-payment",
            headers=headers,
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/seller/orders/{order_id}/status",
            headers=headers,
            json={"status": "PREPARING"},
        ).status_code
        == 200
    )

    shipped = client.patch(
        f"/api/v1/seller/orders/{order_id}/status",
        headers=headers,
        json={"status": "SHIPPED", "tracking_code": "POST-998877"},
    )
    assert shipped.status_code == 200
    assert shipped.json()["status"] == "SHIPPED"
    assert shipped.json()["tracking_code"] == "POST-998877"
