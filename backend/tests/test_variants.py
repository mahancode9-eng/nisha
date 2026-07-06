"""Tests for product variants (roadmap task 16)."""

from decimal import Decimal

from app.models.order import Order
from app.services import stock_service


def _create_variant_product(client, headers, **overrides):
    payload = {
        "title": "تیشرت نیشا",
        "description": "تیشرت با سایزبندی",
        "price": "100000",
        "stock_quantity": 0,
        "is_active": True,
        "variants": [
            {"name": "سایز S", "stock_quantity": 3, "sort_order": 0},
            {
                "name": "سایز L",
                "price_override": "120000",
                "stock_quantity": 2,
                "sort_order": 1,
            },
        ],
    }
    payload.update(overrides)
    resp = client.post("/api/v1/seller/products", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _order_payload(product_id, variant_id, payment_method_id, quantity=1):
    return {
        "buyer_name": "خریدار تستی",
        "buyer_phone": "09123456789",
        "buyer_address": "تهران، خیابان آزادی",
        "payment_method_id": payment_method_id,
        "items": [
            {"product_id": product_id, "variant_id": variant_id, "quantity": quantity}
        ],
    }


def test_create_product_with_variants(client, public_store):
    product = _create_variant_product(client, public_store["seller_headers"])

    assert len(product["variants"]) == 2
    names = [variant["name"] for variant in product["variants"]]
    assert names == ["سایز S", "سایز L"]
    # Parent stock is kept in sync with the sum of active variant stocks.
    assert product["stock_quantity"] == 5
    assert Decimal(product["variants"][1]["price_override"]) == Decimal("120000")


def test_update_product_replaces_variants(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)

    resp = client.put(
        f"/api/v1/seller/products/{product['id']}",
        json={"variants": [{"name": "تک‌سایز", "stock_quantity": 7}]},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["variants"]) == 1
    assert body["variants"][0]["name"] == "تک‌سایز"
    assert body["stock_quantity"] == 7


def test_public_product_shows_only_active_variants(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(
        client,
        headers,
        variants=[
            {"name": "فعال", "stock_quantity": 4},
            {"name": "غیرفعال", "stock_quantity": 1, "is_active": False},
        ],
    )

    resp = client.get(
        f"/api/v1/public/stores/{public_store['slug']}/products/{product['id']}"
    )
    assert resp.status_code == 200, resp.text
    variants = resp.json()["product"]["variants"]
    assert [variant["name"] for variant in variants] == ["فعال"]


def test_checkout_with_variant_uses_override_price(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)
    variant_l = product["variants"][1]

    resp = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(
            product["id"], variant_l["id"], public_store["payment_method_id"]
        ),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert Decimal(str(body["total_amount"])) == Decimal("120000")
    assert body["items"][0]["variant_name"] == "سایز L"

    # Variant stock decremented and parent stock kept in sync.
    detail = client.get(
        f"/api/v1/seller/products/{product['id']}", headers=headers
    ).json()
    assert detail["variants"][1]["stock_quantity"] == 1
    assert detail["stock_quantity"] == 4


def test_checkout_requires_variant_for_variant_products(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)

    resp = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(product["id"], None, public_store["payment_method_id"]),
    )
    assert resp.status_code == 422
    assert "واریانت" in resp.json()["detail"]


def test_checkout_rejects_unknown_variant(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)

    resp = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(product["id"], 999999, public_store["payment_method_id"]),
    )
    assert resp.status_code == 422


def test_checkout_rejects_variant_for_simple_product(client, public_store):
    resp = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(
            public_store["product_id"], 123456, public_store["payment_method_id"]
        ),
    )
    assert resp.status_code == 422


def test_checkout_variant_insufficient_stock(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)
    variant_s = product["variants"][0]

    resp = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(
            product["id"],
            variant_s["id"],
            public_store["payment_method_id"],
            quantity=99,
        ),
    )
    assert resp.status_code == 422


def test_track_order_shows_variant_name(client, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)
    variant_s = product["variants"][0]

    checkout = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(
            product["id"], variant_s["id"], public_store["payment_method_id"]
        ),
    ).json()

    resp = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": checkout["invoice_code"],
            "invoice_edit_password": checkout["invoice_edit_password"],
        },
    )
    assert resp.status_code == 200, resp.text
    items = resp.json()["items"]
    assert items[0]["variant_name"] == "سایز S"


def test_restore_stock_returns_variant_stock(client, db, public_store):
    headers = public_store["seller_headers"]
    product = _create_variant_product(client, headers)
    variant_s = product["variants"][0]

    checkout = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(
            product["id"],
            variant_s["id"],
            public_store["payment_method_id"],
            quantity=2,
        ),
    ).json()

    order = db.get(Order, checkout["order_id"])
    assert stock_service.restore_order_stock(db, order) is True
    db.commit()

    detail = client.get(
        f"/api/v1/seller/products/{product['id']}", headers=headers
    ).json()
    assert detail["variants"][0]["stock_quantity"] == 3
    assert detail["stock_quantity"] == 5
