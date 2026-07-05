def test_products_pagination(client, seller_headers):
    for i in range(3):
        response = client.post(
            "/api/v1/seller/products",
            headers=seller_headers,
            json={
                "title": f"Product {i}",
                "price": "10.00",
                "stock_quantity": 1,
            },
        )
        assert response.status_code == 201

    page1 = client.get(
        "/api/v1/seller/products",
        headers=seller_headers,
        params={"page": 1, "page_size": 2},
    )
    assert page1.status_code == 200
    data = page1.json()
    assert data["total"] == 3
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 2
    assert len(data["items"]) == 2

    page2 = client.get(
        "/api/v1/seller/products",
        headers=seller_headers,
        params={"page": 2, "page_size": 2},
    )
    assert page2.status_code == 200
    assert len(page2.json()["items"]) == 1

    empty = client.get(
        "/api/v1/seller/products",
        headers=seller_headers,
        params={"page": 99, "page_size": 20},
    )
    assert empty.status_code == 200
    assert empty.json()["items"] == []
    assert empty.json()["total"] == 3
