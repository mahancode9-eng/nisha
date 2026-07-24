from app.services import platform_setting_service


def _order_payload(public_store: dict, *, quantity: int = 2) -> dict:
    return {
        "buyer_name": "Ali Customer",
        "buyer_phone": "+989121111111",
        "buyer_address": "Tehran, Iran",
        "buyer_note": "Please call before delivery",
        "payment_method_id": public_store["payment_method_id"],
        "items": [{"product_id": public_store["product_id"], "quantity": quantity}],
    }


def test_guest_order_succeeds_when_enabled(client, public_store):
    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )
    assert response.status_code == 201


def test_guest_order_blocked_when_store_disabled(client, public_store):
    disable = client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"guest_checkout_enabled": False},
    )
    assert disable.status_code == 200

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )
    assert response.status_code == 403
    assert "خرید مهمان" in response.json()["detail"]


def test_guest_order_blocked_when_platform_disabled(client, public_store, admin_headers, db):
    platform_setting_service.set_bool(
        db,
        platform_setting_service.GUEST_CHECKOUT_PLATFORM_KEY,
        False,
    )

    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )
    assert response.status_code == 403


def test_customer_order_succeeds_when_guest_checkout_disabled(client, public_store, db):
    disable = client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"guest_checkout_enabled": False},
    )
    assert disable.status_code == 200

    register = client.post(
        "/api/v1/customer/register",
        json={
            "email": "guest-toggle@example.com",
            "password": "securepass",
            "full_name": "Guest Toggle Customer",
            "phone": "+989125555555",
        },
    )
    assert register.status_code == 201

    from conftest import mark_customer_email_verified

    mark_customer_email_verified(db, "guest-toggle@example.com")

    login = client.post(
        "/api/v1/customer/login",
        json={"login": "guest-toggle@example.com", "password": "securepass"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.post(
        f"/api/v1/customer/stores/{public_store['slug']}/orders",
        headers=headers,
        json={
            "buyer_name": "Logged In Buyer",
            "buyer_phone": "+989125555555",
            "buyer_address": "Tehran, Iran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
        },
    )
    assert response.status_code == 201


def test_public_store_exposes_guest_checkout_flag(client, public_store):
    response = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert response.status_code == 200
    assert response.json()["store"]["guest_checkout_enabled"] is True

    client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"guest_checkout_enabled": False},
    )

    response = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert response.status_code == 200
    assert response.json()["store"]["guest_checkout_enabled"] is False


def test_admin_can_toggle_store_guest_checkout(client, public_store, admin_headers, db):
    store = client.get("/api/v1/seller/store", headers=public_store["seller_headers"])
    store_id = store.json()["id"]

    response = client.patch(
        f"/api/v1/admin/stores/{store_id}/guest-checkout",
        headers=admin_headers,
        json={"guest_checkout_enabled": False},
    )
    assert response.status_code == 200
    assert response.json()["store"]["guest_checkout_enabled"] is False

    order = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json=_order_payload(public_store),
    )
    assert order.status_code == 403


def test_admin_platform_settings(client, admin_headers, db):
    response = client.get("/api/v1/admin/settings", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["guest_checkout_enabled"] is True

    response = client.patch(
        "/api/v1/admin/settings",
        headers=admin_headers,
        json={"guest_checkout_enabled": False},
    )
    assert response.status_code == 200
    assert response.json()["guest_checkout_enabled"] is False

    platform_setting_service.set_bool(
        db,
        platform_setting_service.GUEST_CHECKOUT_PLATFORM_KEY,
        True,
    )
