def test_customer_register_and_me(client):
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
    assert data["token_type"] == "bearer"
    assert data["customer"]["email"] == "buyer@example.com"

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me = client.get("/api/v1/customer/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["full_name"] == "Buyer One"


def test_customer_login(client):
    client.post(
        "/api/v1/customer/register",
        json={
            "email": "login-buyer@example.com",
            "password": "securepass",
            "full_name": "Login Buyer",
        },
    )
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
