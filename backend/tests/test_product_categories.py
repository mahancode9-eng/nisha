def test_seller_category_crud(client, public_store):
    create = client.post(
        "/api/v1/seller/categories",
        headers=public_store["seller_headers"],
        json={"name": "کیف و کفش"},
    )
    assert create.status_code == 201
    category = create.json()
    assert category["name"] == "کیف و کفش"
    assert category["slug"]

    listing = client.get(
        "/api/v1/seller/categories",
        headers=public_store["seller_headers"],
    )
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    delete = client.delete(
        f"/api/v1/seller/categories/{category['id']}",
        headers=public_store["seller_headers"],
    )
    assert delete.status_code == 204


def test_product_category_assignment_and_public_filter(client, public_store):
    category = client.post(
        "/api/v1/seller/categories",
        headers=public_store["seller_headers"],
        json={"name": "Hoodies"},
    ).json()

    other_product = client.post(
        "/api/v1/seller/products",
        headers=public_store["seller_headers"],
        json={
            "title": "Other Item",
            "price": "10",
            "stock_quantity": 5,
            "is_active": True,
        },
    )
    assert other_product.status_code == 201
    other_id = other_product.json()["id"]

    assign = client.put(
        f"/api/v1/seller/products/{public_store['product_id']}",
        headers=public_store["seller_headers"],
        json={"category_id": category["id"]},
    )
    assert assign.status_code == 200
    assert assign.json()["category"]["slug"] == category["slug"]

    store_page = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert store_page.status_code == 200
    page_data = store_page.json()
    assert any(item["slug"] == category["slug"] for item in page_data["categories"])

    filtered = client.get(
        f"/api/v1/public/stores/{public_store['slug']}/products?category={category['slug']}",
    )
    assert filtered.status_code == 200
    items = filtered.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == public_store["product_id"]

    all_products = client.get(f"/api/v1/public/stores/{public_store['slug']}/products")
    assert all_products.status_code == 200
    assert len(all_products.json()["items"]) == 2

    # Block delete when products are assigned
    blocked = client.delete(
        f"/api/v1/seller/categories/{category['id']}",
        headers=public_store["seller_headers"],
    )
    assert blocked.status_code == 409

    unassign = client.put(
        f"/api/v1/seller/products/{public_store['product_id']}",
        headers=public_store["seller_headers"],
        json={"category_id": None},
    )
    assert unassign.status_code == 200
    assert unassign.json()["category_id"] is None

    retry_delete = client.delete(
        f"/api/v1/seller/categories/{category['id']}",
        headers=public_store["seller_headers"],
    )
    assert retry_delete.status_code == 204
