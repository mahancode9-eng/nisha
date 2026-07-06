def test_sitemap_lists_store_and_products(client, public_store):
    resp = client.get("/api/v1/public/sitemap")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert any(store["slug"] == public_store["slug"] for store in data["stores"])
    assert any(
        product["product_id"] == public_store["product_id"]
        and product["store_slug"] == public_store["slug"]
        for product in data["products"]
    )
