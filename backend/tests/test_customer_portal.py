from app.models.enums import ComplaintStatus, CustomerReceiptStatus, OrderStatus
from app.models.order import Order


def register_customer(client, **overrides):
    payload = {
        "email": "portal-buyer@example.com",
        "phone": "+989121111111",
        "postal_code": "1234567890",
        "password": "securepass",
        "full_name": "Portal Buyer",
    }
    payload.update(overrides)
    response = client.post("/api/v1/customer/register", json=payload)
    assert response.status_code == 201
    return response.json()


def test_customer_profile_and_addresses(client):
    token = register_customer(client)
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    profile = client.get("/api/v1/customer/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["postal_code"] == "1234567890"

    updated = client.patch(
        "/api/v1/customer/profile",
        headers=headers,
        json={"full_name": "Updated Portal Buyer", "postal_code": "9876543210"},
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Updated Portal Buyer"

    address = client.post(
        "/api/v1/customer/addresses",
        headers=headers,
        json={
            "label": "Home",
            "recipient_name": "Updated Portal Buyer",
            "recipient_phone": "+989121111111",
            "postal_code": "9876543210",
            "address_line1": "Tehran, Valiasr St",
            "address_line2": "Apt 12",
            "city": "Tehran",
            "province": "Tehran",
            "country": "Iran",
            "is_default": True,
        },
    )
    assert address.status_code == 201

    addresses = client.get("/api/v1/customer/addresses", headers=headers)
    assert addresses.status_code == 200
    assert len(addresses.json()) == 1
    assert addresses.json()[0]["is_default"] is True


def test_customer_dashboard_summary(client):
    token = register_customer(client)
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    client.post(
        "/api/v1/customer/addresses",
        headers=headers,
        json={
            "label": "Home",
            "recipient_name": "Portal Buyer",
            "recipient_phone": "+989121111111",
            "address_line1": "Tehran, Valiasr St",
            "city": "Tehran",
            "province": "Tehran",
            "country": "Iran",
            "is_default": True,
        },
    )

    dashboard = client.get("/api/v1/customer/dashboard", headers=headers)
    assert dashboard.status_code == 200
    data = dashboard.json()
    assert data["profile"]["full_name"] == "Portal Buyer"
    assert len(data["addresses"]) == 1
    assert data["addresses"][0]["is_default"] is True


def test_customer_recovery_flow(client):
    register_customer(client, email="recover@example.com", phone=None)

    request = client.post(
        "/api/v1/customer/password-recovery/request",
        json={"login": "recover@example.com", "channel": "EMAIL"},
    )
    assert request.status_code == 200
    data = request.json()
    assert data["debug_code"]

    wrong_code = "000000" if data["debug_code"] != "000000" else "111111"
    for _ in range(5):
        failed = client.post(
            "/api/v1/customer/password-recovery/verify",
            json={
                "recovery_id": data["recovery_id"],
                "code": wrong_code,
                "new_password": "newsecurepass",
            },
        )
        assert failed.status_code == 401

    verify = client.post(
        "/api/v1/customer/password-recovery/verify",
        json={
            "recovery_id": data["recovery_id"],
            "code": data["debug_code"],
            "new_password": "newsecurepass",
        },
    )
    assert verify.status_code == 429

    login = client.post(
        "/api/v1/customer/login",
        json={"login": "recover@example.com", "password": "newsecurepass"},
    )
    assert login.status_code == 401


def test_customer_claim_order_and_history(client, placed_order, db):
    token = register_customer(client, email="claim@example.com", phone="+989122222222")
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

    duplicate = client.post(
        "/api/v1/customer/orders/claim",
        headers=headers,
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_password": placed_order["password"],
        },
    )
    assert duplicate.status_code == 200

    order = db.get(Order, placed_order["order_id"])
    assert order.customer_id is not None

    history = client.get("/api/v1/customer/orders", headers=headers)
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["invoice_code"] == placed_order["invoice_code"]

    detail = client.get(f"/api/v1/customer/orders/{placed_order['order_id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["customer_id"] == token["customer"]["id"]

    public_track = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_edit_password": placed_order["password"],
        },
    )
    assert public_track.status_code == 200


def test_customer_receipt_complaint_and_download(client, placed_order, db):
    token = register_customer(client, email="complaint@example.com", phone="+989123333333")
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    client.post(
        "/api/v1/customer/orders/claim",
        headers=headers,
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_password": placed_order["password"],
        },
    )

    order = db.get(Order, placed_order["order_id"])
    order.status = OrderStatus.SHIPPED
    db.commit()

    receipt = client.post(
        f"/api/v1/customer/orders/{placed_order['order_id']}/receipt",
        headers=headers,
        json={"receipt_status": "NOT_RECEIVED"},
    )
    assert receipt.status_code == 200
    assert receipt.json()["receipt_status"] == "NOT_RECEIVED"

    complaint = client.post(
        f"/api/v1/customer/orders/{placed_order['order_id']}/complaints",
        headers=headers,
        json={"reason": "NON_DELIVERY", "message": "Package has not arrived."},
    )
    assert complaint.status_code == 200
    assert complaint.json()["status"] == ComplaintStatus.OPEN.value

    complaints = client.get("/api/v1/customer/complaints", headers=headers)
    assert complaints.status_code == 200
    assert len(complaints.json()) == 1

    download = client.get(
        f"/api/v1/customer/orders/{placed_order['order_id']}/invoice",
        headers=headers,
    )
    assert download.status_code == 200
    assert "attachment" in download.headers["content-disposition"]
    assert placed_order["invoice_code"] in download.text


def test_customer_checkout_can_attach_owner_and_save_address(client, public_store):
    token = register_customer(client, email="checkout@example.com", phone="+989124444444")
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    response = client.post(
        f"/api/v1/customer/stores/{public_store['slug']}/orders",
        headers=headers,
        json={
            "buyer_name": "Recipient One",
            "buyer_phone": "+989124444444",
            "buyer_address": "Isfahan, Si-o-se-pol",
            "postal_code": "1111111111",
            "buyer_note": "Leave with guard",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 1}],
            "save_address": True,
            "address_label": "Saved checkout address",
            "city": "Isfahan",
            "province": "Isfahan",
            "country": "Iran",
        },
    )
    assert response.status_code == 201
    order_id = response.json()["order_id"]

    order = client.get(f"/api/v1/customer/orders/{order_id}", headers=headers)
    assert order.status_code == 200
    assert order.json()["buyer_name"] == "Recipient One"

    addresses = client.get("/api/v1/customer/addresses", headers=headers)
    assert len(addresses.json()) == 1
