"""R4c: manual orders + Instagram product import."""


def test_manual_order_create(client, public_store):
    res = client.post(
        "/api/v1/seller/orders/manual",
        headers=public_store["seller_headers"],
        json={
            "buyer_name": "DM Buyer",
            "buyer_phone": "09123334455",
            "buyer_address": "Tehran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
            "mark_paid": True,
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["is_manual"] is True
    assert body["status"] == "PAYMENT_CONFIRMED"
    assert body["invoice_code"]

    detail = client.get(
        f"/api/v1/seller/orders/{body['order_id']}",
        headers=public_store["seller_headers"],
    )
    assert detail.status_code == 200
    assert detail.json()["is_manual"] is True


def test_instagram_import_creates_inactive_product(client, public_store):
    res = client.post(
        "/api/v1/seller/products/import-instagram",
        headers=public_store["seller_headers"],
        json={
            "caption": "هودی مشکی زمستونی\nقیمت ۳۵۰۰۰۰ تومان\nسایز M و L",
            "image_url": "/uploads/demo-hoodie.jpg",
            "stock_quantity": 3,
        },
    )
    assert res.status_code == 201
    product = res.json()
    assert product["title"].startswith("هودی")
    assert product["is_active"] is False
    assert product["stock_quantity"] == 3
    assert len(product["images"]) >= 1
