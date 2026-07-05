def test_get_store(client, seller_headers):
    response = client.get("/api/v1/seller/store", headers=seller_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "seller-a"
    assert data["name"] == "Seller A's Store"


def test_update_store(client, seller_headers):
    response = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"name": "Updated Shop", "phone": "+989121234567"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Shop"
    assert data["phone"] == "+989121234567"


def test_slug_uniqueness(client, seller_headers, other_seller_headers):
    take_slug = client.put(
        "/api/v1/seller/store",
        headers=other_seller_headers,
        json={"slug": "my-unique-shop"},
    )
    assert take_slug.status_code == 200

    conflict = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"slug": "my-unique-shop"},
    )
    assert conflict.status_code == 409
    assert conflict.json()["detail"] == "اسلاگ قبلا گرفته شده است"

    keep_own = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"slug": "seller-a"},
    )
    assert keep_own.status_code == 200
