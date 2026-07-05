def test_product_crud(client, seller_headers):
    create = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "T-Shirt",
            "description": "Cotton tee",
            "price": "29.99",
            "stock_quantity": 10,
            "is_active": True,
        },
    )
    assert create.status_code == 201
    product_id = create.json()["id"]

    list_response = client.get("/api/v1/seller/products", headers=seller_headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1
    assert len(list_response.json()["items"]) == 1

    get_response = client.get(
        f"/api/v1/seller/products/{product_id}",
        headers=seller_headers,
    )
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "T-Shirt"

    update = client.put(
        f"/api/v1/seller/products/{product_id}",
        headers=seller_headers,
        json={"title": "Updated T-Shirt", "stock_quantity": 5},
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Updated T-Shirt"
    assert update.json()["stock_quantity"] == 5

    delete = client.delete(
        f"/api/v1/seller/products/{product_id}",
        headers=seller_headers,
    )
    assert delete.status_code == 204

    missing = client.get(
        f"/api/v1/seller/products/{product_id}",
        headers=seller_headers,
    )
    assert missing.status_code == 404


def test_product_images(client, seller_headers):
    response = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "Mug",
            "price": "12.50",
            "stock_quantity": 3,
            "image_urls": ["https://cdn.example.com/mug-1.jpg", "https://cdn.example.com/mug-2.jpg"],
        },
    )

    assert response.status_code == 201
    images = response.json()["images"]
    assert len(images) == 2
    assert images[0]["sort_order"] == 0
    assert images[1]["image_url"].endswith("mug-2.jpg")


def test_cannot_access_other_seller_product(client, seller_headers, other_seller_headers):
    create = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={"title": "Private Item", "price": "9.99", "stock_quantity": 1},
    )
    product_id = create.json()["id"]

    for method, url, kwargs in [
        ("get", f"/api/v1/seller/products/{product_id}", {}),
        (
            "put",
            f"/api/v1/seller/products/{product_id}",
            {"json": {"title": "Hacked"}},
        ),
        ("delete", f"/api/v1/seller/products/{product_id}", {}),
    ]:
        response = getattr(client, method)(url, headers=other_seller_headers, **kwargs)
        assert response.status_code == 404
