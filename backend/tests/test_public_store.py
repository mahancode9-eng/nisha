def test_get_public_store(client, public_store):
    response = client.get(f"/api/v1/public/stores/{public_store['slug']}")

    assert response.status_code == 200
    data = response.json()
    assert data["store"]["slug"] == public_store["slug"]
    assert len(data["products"]) == 1
    assert data["products"][0]["title"] == "Public Hoodie"
    assert len(data["payment_methods"]) == 1


def test_list_public_products(client, public_store):
    response = client.get(f"/api/v1/public/stores/{public_store['slug']}/products")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["stock_quantity"] == 10


def test_inactive_store_not_found(client, public_store):
    deactivate = client.put(
        "/api/v1/seller/store",
        headers=public_store["seller_headers"],
        json={"is_active": False},
    )
    assert deactivate.status_code == 200

    response = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert response.status_code == 404
