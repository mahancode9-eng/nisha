from fastapi.testclient import TestClient


def test_service_error_returns_detail_json(client: TestClient, seller_headers: dict) -> None:
    response = client.get(
        "/api/v1/seller/products/999999",
        headers=seller_headers,
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "محصول پیدا نشد"}


def test_validation_error_returns_detail_list(client: TestClient, seller_headers: dict) -> None:
    response = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={"title": "X", "price": "not-a-number", "stock_quantity": 1},
    )
    assert response.status_code == 422
    body = response.json()
    assert "detail" in body
    assert isinstance(body["detail"], list)
    assert len(body["detail"]) >= 1
