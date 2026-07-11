from tests.conftest import mark_customer_email_verified


def test_customer_register_and_me(client, db):
    register = client.post(
        "/api/v1/customer/register",
        json={
            "email": "buyer@example.com",
            "password": "securepass",
            "full_name": "Buyer One",
        },
    )
    assert register.status_code == 201
    data = register.json()
    assert data["needs_email_verification"] is True
    mark_customer_email_verified(db, "buyer@example.com")
    login = client.post(
        "/api/v1/customer/login",
        json={"login": "buyer@example.com", "password": "securepass"},
    )
    data = login.json()

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me = client.get("/api/v1/customer/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["full_name"] == "Buyer One"


def test_customer_login(client, db):
    client.post(
        "/api/v1/customer/register",
        json={
            "email": "login-buyer@example.com",
            "password": "securepass",
            "full_name": "Login Buyer",
        },
    )
    mark_customer_email_verified(db, "login-buyer@example.com")
    response = client.post(
        "/api/v1/customer/login",
        json={"login": "login-buyer@example.com", "password": "securepass"},
    )
    assert response.status_code == 200
    assert response.json()["customer"]["email"] == "login-buyer@example.com"


def test_customer_register_requires_email_or_phone(client):
    response = client.post(
        "/api/v1/customer/register",
        json={"password": "securepass", "full_name": "No Contact"},
    )
    assert response.status_code == 422


def test_seller_token_cannot_access_customer_me(client, seller_headers):
    response = client.get("/api/v1/customer/me", headers=seller_headers)
    assert response.status_code == 401
