from fastapi.testclient import TestClient


def test_public_homepage_discovery_payload(client: TestClient, public_store: dict) -> None:
    response = client.get("/api/v1/public/home")

    assert response.status_code == 200
    data = response.json()
    assert data["hero_title"]
    assert data["search_hint"]
    assert "stats" in data
    assert data["stats"]["total_stores"] >= 1
    assert len(data["categories"]) >= 1
    assert len(data["featured_products"]) >= 1
    assert len(data["featured_stores"]) >= 1
