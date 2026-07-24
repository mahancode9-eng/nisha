def test_list_platform_users(client, admin_headers, seller_headers):
    response = client.get("/api/v1/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    roles = {item["role"] for item in data["items"]}
    assert "ADMIN" in roles
    assert "SELLER" in roles


def test_update_user_and_reset_password(client, admin_headers, seller_headers, db):
    users = client.get("/api/v1/admin/users?role=SELLER", headers=admin_headers)
    seller = users.json()["items"][0]
    seller_id = seller["id"]

    updated = client.patch(
        f"/api/v1/admin/users/{seller_id}",
        headers=admin_headers,
        json={"full_name": "Updated Seller Name"},
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Updated Seller Name"

    password = client.post(
        f"/api/v1/admin/users/{seller_id}/password",
        headers=admin_headers,
        json={"password": "newsecurepass"},
    )
    assert password.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={"email": seller["email"], "password": "newsecurepass"},
    )
    assert login.status_code == 200


def test_admin_cannot_deactivate_self(client, admin_headers):
    users = client.get("/api/v1/admin/users?role=ADMIN", headers=admin_headers)
    admin_id = users.json()["items"][0]["id"]

    response = client.patch(
        f"/api/v1/admin/users/{admin_id}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert response.status_code == 422


def test_list_and_update_customer(client, admin_headers, db):
    from tests.test_customer_portal import register_customer

    register_customer(client, db, email="admin-user-mgmt@example.com", phone="+989129999999")

    listed = client.get("/api/v1/admin/customers?search=admin-user-mgmt", headers=admin_headers)
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
    customer = listed.json()["items"][0]

    updated = client.patch(
        f"/api/v1/admin/customers/{customer['id']}",
        headers=admin_headers,
        json={"full_name": "Managed Customer"},
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Managed Customer"

    password = client.post(
        f"/api/v1/admin/customers/{customer['id']}/password",
        headers=admin_headers,
        json={"password": "customerpass123"},
    )
    assert password.status_code == 200

    login = client.post(
        "/api/v1/customer/login",
        json={"login": "admin-user-mgmt@example.com", "password": "customerpass123"},
    )
    assert login.status_code == 200


def test_non_admin_cannot_access_users(client, seller_headers):
    response = client.get("/api/v1/admin/users", headers=seller_headers)
    assert response.status_code == 403
