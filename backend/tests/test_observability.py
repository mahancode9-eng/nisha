from fastapi.testclient import TestClient


def test_response_has_request_id_header(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers.get("x-request-id")


def test_incoming_request_id_is_echoed(client: TestClient):
    response = client.get("/api/v1/health", headers={"X-Request-ID": "test-req-123"})
    assert response.headers.get("x-request-id") == "test-req-123"


def test_security_headers_present(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in response.headers.get("permissions-policy", "")
