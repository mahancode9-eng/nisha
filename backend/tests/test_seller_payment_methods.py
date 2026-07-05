CARD_TO_CARD_PAYLOAD = {
    "type": "CARD_TO_CARD",
    "display_name": "Bank Transfer",
    "card_number": "6037-1234-5678-9012",
    "owner_name": "Jane Seller",
    "instructions": "Send receipt after payment",
}


def test_payment_method_crud(client, seller_headers):
    create = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json=CARD_TO_CARD_PAYLOAD,
    )
    assert create.status_code == 201
    method_id = create.json()["id"]

    list_response = client.get("/api/v1/seller/payment-methods", headers=seller_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    get_response = client.get(
        f"/api/v1/seller/payment-methods/{method_id}",
        headers=seller_headers,
    )
    assert get_response.status_code == 200
    assert get_response.json()["display_name"] == "Bank Transfer"

    update = client.put(
        f"/api/v1/seller/payment-methods/{method_id}",
        headers=seller_headers,
        json={"display_name": "Updated Transfer"},
    )
    assert update.status_code == 200
    assert update.json()["display_name"] == "Updated Transfer"

    delete = client.delete(
        f"/api/v1/seller/payment-methods/{method_id}",
        headers=seller_headers,
    )
    assert delete.status_code == 204


def test_card_to_card_validation(client, seller_headers):
    response = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json={
            "type": "CARD_TO_CARD",
            "display_name": "Invalid Card",
            "owner_name": "Jane Seller",
        },
    )
    assert response.status_code == 422


def test_crypto_validation(client, seller_headers):
    response = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json={
            "type": "CRYPTO",
            "display_name": "USDT",
        },
    )
    assert response.status_code == 422


def test_external_gateway_validation(client, seller_headers):
    response = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json={
            "type": "EXTERNAL_GATEWAY",
            "display_name": "Pay Link",
        },
    )
    assert response.status_code == 422


def test_cannot_access_other_seller_payment_method(
    client,
    seller_headers,
    other_seller_headers,
):
    create = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json=CARD_TO_CARD_PAYLOAD,
    )
    method_id = create.json()["id"]

    response = client.get(
        f"/api/v1/seller/payment-methods/{method_id}",
        headers=other_seller_headers,
    )
    assert response.status_code == 404
