from decimal import Decimal


def _checkout_payload(public_store, quantity=1, discount_code=None):
    payload = {
        "buyer_name": "خریدار تست",
        "buyer_phone": "09123456789",
        "buyer_address": "تهران، خیابان تست، پلاک ۱",
        "payment_method_id": public_store["payment_method_id"],
        "items": [
            {"product_id": public_store["product_id"], "quantity": quantity}
        ],
    }
    if discount_code is not None:
        payload["discount_code"] = discount_code
    return payload


def _checkout(client, public_store, **kwargs):
    return client.post(
        "/api/v1/public/stores/" + public_store["slug"] + "/orders",
        json=_checkout_payload(public_store, **kwargs),
    )


def _create_discount(client, seller_headers, **overrides):
    body = {
        "code": "SAVE10",
        "discount_type": "PERCENT",
        "percent_off": 10,
    }
    body.update(overrides)
    resp = client.post("/api/v1/seller/discounts", json=body, headers=seller_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_seller_discount_crud(client, public_store):
    headers = public_store["seller_headers"]
    created = _create_discount(client, headers, code="crudtest", percent_off=15)
    # Codes are normalized to uppercase.
    assert created["code"] == "CRUDTEST"

    listed = client.get("/api/v1/seller/discounts", headers=headers)
    assert listed.status_code == 200
    assert any(item["id"] == created["id"] for item in listed.json())

    updated = client.put(
        "/api/v1/seller/discounts/" + str(created["id"]),
        json={"is_active": False},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False

    deleted = client.delete(
        "/api/v1/seller/discounts/" + str(created["id"]),
        headers=headers,
    )
    assert deleted.status_code == 204

    missing = client.get(
        "/api/v1/seller/discounts/" + str(created["id"]),
        headers=headers,
    )
    assert missing.status_code == 404


def test_percent_discount_applies_at_checkout(client, public_store):
    _create_discount(client, public_store["seller_headers"], code="SAVE10", percent_off=10)

    resp = _checkout(client, public_store, discount_code="save10")
    assert resp.status_code in (200, 201), resp.text
    data = resp.json()

    subtotal = Decimal(str(data["subtotal_amount"]))
    discount = Decimal(str(data["discount_amount"]))
    total = Decimal(str(data["total_amount"]))

    assert data["discount_code"] == "SAVE10"
    assert discount == (subtotal * Decimal("0.10")).quantize(Decimal("0.01"))
    assert total == subtotal - discount


def test_fixed_discount_capped_at_subtotal(client, public_store):
    _create_discount(
        client,
        public_store["seller_headers"],
        code="OFF1000",
        discount_type="FIXED",
        percent_off=None,
        amount_off=1000,
    )

    resp = _checkout(client, public_store, discount_code="OFF1000")
    assert resp.status_code in (200, 201), resp.text
    data = resp.json()

    subtotal = Decimal(str(data["subtotal_amount"]))
    discount = Decimal(str(data["discount_amount"]))
    total = Decimal(str(data["total_amount"]))

    assert discount == min(Decimal("1000"), subtotal)
    assert total == subtotal - discount
    assert total >= Decimal("0")


def test_invalid_discount_code_rejected(client, public_store):
    resp = _checkout(client, public_store, discount_code="NOPE")
    assert resp.status_code == 422


def test_expired_discount_code_rejected(client, public_store):
    _create_discount(
        client,
        public_store["seller_headers"],
        code="OLD",
        expires_at="2020-01-01T00:00:00Z",
    )
    resp = _checkout(client, public_store, discount_code="OLD")
    assert resp.status_code == 422


def test_min_order_amount_enforced(client, public_store):
    _create_discount(
        client,
        public_store["seller_headers"],
        code="BIGONLY",
        min_order_amount=999999999,
    )
    resp = _checkout(client, public_store, discount_code="BIGONLY")
    assert resp.status_code == 422


def test_max_uses_enforced(client, public_store):
    _create_discount(
        client,
        public_store["seller_headers"],
        code="ONCE",
        max_uses=1,
    )

    first = _checkout(client, public_store, discount_code="ONCE")
    assert first.status_code in (200, 201), first.text

    second = _checkout(client, public_store, discount_code="ONCE")
    assert second.status_code == 422


def test_inactive_discount_rejected(client, public_store):
    headers = public_store["seller_headers"]
    created = _create_discount(client, headers, code="PAUSED")
    client.put(
        "/api/v1/seller/discounts/" + str(created["id"]),
        json={"is_active": False},
        headers=headers,
    )
    resp = _checkout(client, public_store, discount_code="PAUSED")
    assert resp.status_code == 422


def test_discount_preview_endpoint(client, public_store):
    _create_discount(client, public_store["seller_headers"], code="PREVIEW", percent_off=10)

    ok = client.post(
        "/api/v1/public/stores/" + public_store["slug"] + "/discount-preview",
        json={"code": "preview", "subtotal": 10000},
    )
    assert ok.status_code == 200, ok.text
    data = ok.json()
    assert data["code"] == "PREVIEW"
    assert Decimal(str(data["discount_amount"])) == Decimal("1000.00")
    assert Decimal(str(data["payable_amount"])) == Decimal("9000.00")

    bad = client.post(
        "/api/v1/public/stores/" + public_store["slug"] + "/discount-preview",
        json={"code": "missing", "subtotal": 10000},
    )
    assert bad.status_code == 422


def test_discount_reflected_in_order_tracking(client, public_store):
    _create_discount(client, public_store["seller_headers"], code="TRACKME", percent_off=10)

    placed = _checkout(client, public_store, discount_code="TRACKME")
    assert placed.status_code in (200, 201), placed.text
    created = placed.json()

    tracked = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": created["invoice_code"],
            "invoice_edit_password": created["invoice_edit_password"],
        },
    )
    assert tracked.status_code == 200, tracked.text
    data = tracked.json()
    assert data["discount_code"] == "TRACKME"
    assert Decimal(str(data["discount_amount"])) > Decimal("0")
