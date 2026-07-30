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


def test_guest_order_blocked_on_free_plan(client, seller_headers, db):
    from app.models.enums import BillingPeriod
    from app.models.user import User
    from app.services import subscription_billing_service
    from app.services.auth_service import normalize_email
    from sqlalchemy import select

    seller = db.scalar(select(User).where(User.email == normalize_email("seller-a@example.com")))
    assert seller is not None
    subscription_billing_service.admin_assign_plan(
        db,
        seller.id,
        plan_code="free",
        period=BillingPeriod.MONTHLY,
        months=1,
    )

    enable = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"guest_checkout_enabled": True},
    )
    assert enable.status_code == 403

    store = client.get("/api/v1/seller/store", headers=seller_headers)
    assert store.status_code == 200
    slug = store.json()["slug"]

    # Even if the store flag was previously on, free plan must not expose guest checkout.
    from app.models.store import Store

    store_row = db.scalar(select(Store).where(Store.slug == slug))
    assert store_row is not None
    store_row.guest_checkout_enabled = True
    db.commit()

    public = client.get(f"/api/v1/public/stores/{slug}")
    assert public.status_code == 200
    assert public.json()["store"]["guest_checkout_enabled"] is False

    payment = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json={
            "type": "CARD_TO_CARD",
            "display_name": "Free Plan Card",
            "card_number": "6037-0000-0000-0001",
            "owner_name": "Seller A",
        },
    )
    assert payment.status_code == 201

    product = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "Free Plan Product",
            "price": "10.00",
            "stock_quantity": 5,
            "is_active": True,
        },
    )
    assert product.status_code == 201

    order = client.post(
        f"/api/v1/public/stores/{slug}/orders",
        json={
            "buyer_name": "Ali Customer",
            "buyer_phone": "+989121111111",
            "buyer_address": "Tehran, Iran",
            "payment_method_id": payment.json()["id"],
            "items": [{"product_id": product.json()["id"], "quantity": 1}],
        },
    )
    assert order.status_code == 403
    assert "خرید مهمان" in order.json()["detail"]
