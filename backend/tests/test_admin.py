from fastapi.testclient import TestClient


def test_admin_can_access_dashboard(client: TestClient, admin_headers: dict) -> None:
    response = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_stores" in data
    assert "active_stores" in data
    assert "total_orders" in data
    assert "confirmed_revenue" in data
    assert "recent_orders" in data


def test_seller_cannot_access_admin_dashboard(
    client: TestClient, seller_headers: dict
) -> None:
    response = client.get("/api/v1/admin/dashboard", headers=seller_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "دسترسی مدیر لازم است"


def test_admin_activate_deactivate_store(
    client: TestClient, admin_headers: dict, seller_headers: dict
) -> None:
    stores_response = client.get("/api/v1/admin/stores", headers=admin_headers)
    assert stores_response.status_code == 200
    stores = stores_response.json()["items"]
    assert len(stores) >= 1
    store_id = stores[0]["id"]

    deactivate = client.patch(
        f"/api/v1/admin/stores/{store_id}/deactivate",
        headers=admin_headers,
    )
    assert deactivate.status_code == 200
    assert deactivate.json()["store"]["is_active"] is False

    activate = client.patch(
        f"/api/v1/admin/stores/{store_id}/activate",
        headers=admin_headers,
    )
    assert activate.status_code == 200
    assert activate.json()["store"]["is_active"] is True


def test_admin_can_see_all_orders(
    client: TestClient,
    admin_headers: dict,
    placed_order: dict,
) -> None:
    response = client.get("/api/v1/admin/orders", headers=admin_headers)
    assert response.status_code == 200
    orders = response.json()["items"]
    assert len(orders) >= 1
    match = next((o for o in orders if o["invoice_code"] == placed_order["invoice_code"]), None)
    assert match is not None
    assert "store_id" in match
    assert "store_name" in match
    assert "store_slug" in match


def test_seller_cannot_list_admin_orders(
    client: TestClient, seller_headers: dict
) -> None:
    response = client.get("/api/v1/admin/orders", headers=seller_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "دسترسی مدیر لازم است"


def test_admin_order_detail(
    client: TestClient,
    admin_headers: dict,
    placed_order: dict,
) -> None:
    response = client.get(
        f"/api/v1/admin/orders/{placed_order['order_id']}",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["invoice_code"] == placed_order["invoice_code"]
    assert data["store_slug"] == placed_order["slug"]
    assert len(data["items"]) >= 1
    assert "payment_proofs" in data
    assert isinstance(data["payment_proofs"], list)
    assert data["invoice_username"] == data["invoice_code"]
    assert "submissions" in data
    assert "audit_logs" in data


def test_admin_can_update_order_and_create_audit_log(
    client: TestClient,
    admin_headers: dict,
    placed_order: dict,
) -> None:
    update = client.patch(
        f"/api/v1/admin/orders/{placed_order['order_id']}",
        headers=admin_headers,
        json={
            "status": "PREPARING",
            "note": "Checked by admin",
        },
    )
    assert update.status_code == 200
    assert update.json()["status"] == "PREPARING"

    detail = client.get(
        f"/api/v1/admin/orders/{placed_order['order_id']}",
        headers=admin_headers,
    )
    assert detail.status_code == 200
    logs = detail.json()["audit_logs"]
    assert len(logs) >= 1
    assert logs[0]["action"] == "UPDATE"


def test_admin_store_detail_includes_history_and_audit_logs(
    client: TestClient,
    admin_headers: dict,
    public_store: dict,
) -> None:
    stores_response = client.get("/api/v1/admin/stores", headers=admin_headers)
    assert stores_response.status_code == 200
    store_id = stores_response.json()["items"][0]["id"]

    suspend = client.patch(f"/api/v1/admin/stores/{store_id}/suspend", headers=admin_headers)
    assert suspend.status_code == 200

    detail = client.get(f"/api/v1/admin/stores/{store_id}", headers=admin_headers)
    assert detail.status_code == 200
    data = detail.json()
    assert data["store"]["id"] == store_id
    assert "badges" in data
    assert "badge_history" in data
    assert len(data["audit_logs"]) >= 1
