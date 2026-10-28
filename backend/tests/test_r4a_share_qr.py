"""R4a: short links + QR + share entitlements on public store profile."""


def test_product_short_link_and_redirect(client, public_store):
    create = client.post(
        "/api/v1/public/short-links/product",
        params={
            "slug": public_store["slug"],
            "product_id": public_store["product_id"],
        },
    )
    assert create.status_code == 200
    body = create.json()
    assert body["code"]
    assert body["url"].endswith(f"/l/{body['code']}")
    assert "/qr.png" in body["qr_url"]

    again = client.post(
        "/api/v1/public/short-links/product",
        params={
            "slug": public_store["slug"],
            "product_id": public_store["product_id"],
        },
    )
    assert again.status_code == 200
    assert again.json()["code"] == body["code"]

    redirect = client.get(f"/l/{body['code']}", follow_redirects=False)
    assert redirect.status_code in {302, 307}
    assert f"/products/{public_store['product_id']}" in redirect.headers["location"]


def test_qr_png_endpoint(client):
    res = client.get("/api/v1/public/qr.png", params={"data": "https://nisha.example/store/demo"})
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("image/png")
    assert len(res.content) > 100


def test_public_store_exposes_share_entitlements(client, public_store):
    page = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert page.status_code == 200
    store = page.json()["store"]
    assert "share_card_templates" in store
    assert "remove_nisha_watermark" in store
    # public_store fixture assigns Basic → templates on, watermark still on
    assert store["share_card_templates"] is True
    assert store["remove_nisha_watermark"] is False
