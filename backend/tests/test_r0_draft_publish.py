"""R0: draft stores stay private until published."""


def test_unpublished_store_not_public(client, seller_headers, db):
    # New seller stores start unpublished; force draft explicitly.
    draft = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"is_published": False},
    )
    assert draft.status_code == 200
    assert draft.json()["is_published"] is False
    slug = draft.json()["slug"]

    public = client.get(f"/api/v1/public/stores/{slug}")
    assert public.status_code == 404


def test_publish_makes_store_public(client, seller_headers):
    published = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"is_published": True},
    )
    assert published.status_code == 200
    assert published.json()["is_published"] is True
    slug = published.json()["slug"]

    public = client.get(f"/api/v1/public/stores/{slug}")
    assert public.status_code == 200
    assert public.json()["store"]["slug"] == slug


def test_sitemap_skips_unpublished(client, seller_headers):
    client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={"is_published": False},
    )
    slug = client.get("/api/v1/seller/store", headers=seller_headers).json()["slug"]
    sitemap = client.get("/api/v1/public/sitemap")
    assert sitemap.status_code == 200
    slugs = {item["slug"] for item in sitemap.json()["stores"]}
    assert slug not in slugs
