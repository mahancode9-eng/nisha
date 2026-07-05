import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.store import Store


@pytest.fixture
def customer_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/customer/register",
        json={
            "email": "chat-buyer@example.com",
            "password": "securepass",
            "full_name": "Chat Buyer",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def store_id(db: Session, seller_headers: dict) -> int:
    from sqlalchemy import select

    from app.models.user import User

    user = db.scalar(select(User).where(User.email == "seller-a@example.com"))
    assert user and user.store
    return user.store.id


def test_chat_flow(
    client: TestClient,
    customer_headers: dict,
    seller_headers: dict,
    store_id: int,
):
    create = client.post(
        "/api/v1/customer/conversations",
        headers=customer_headers,
        json={"store_id": store_id},
    )
    assert create.status_code == 201
    conversation_id = create.json()["id"]

    send = client.post(
        f"/api/v1/customer/conversations/{conversation_id}/messages",
        headers=customer_headers,
        json={"body": "Hello seller"},
    )
    assert send.status_code == 200
    assert send.json()["sender_type"] == "CUSTOMER"

    seller_list = client.get("/api/v1/seller/conversations", headers=seller_headers)
    assert seller_list.status_code == 200
    assert len(seller_list.json()) >= 1
    assert seller_list.json()[0]["unread_count"] >= 1

    seller_detail = client.get(
        f"/api/v1/seller/conversations/{conversation_id}",
        headers=seller_headers,
    )
    assert seller_detail.status_code == 200
    assert len(seller_detail.json()["messages"]) == 1
    assert seller_detail.json()["messages"][0]["is_read"] is True

    reply = client.post(
        f"/api/v1/seller/conversations/{conversation_id}/messages",
        headers=seller_headers,
        json={"body": "Hi buyer"},
    )
    assert reply.status_code == 200

    customer_detail = client.get(
        f"/api/v1/customer/conversations/{conversation_id}",
        headers=customer_headers,
    )
    assert customer_detail.status_code == 200
    assert len(customer_detail.json()["messages"]) == 2
    assert customer_detail.json()["messages"][1]["body"] == "Hi buyer"
    assert customer_detail.json()["messages"][1]["is_read"] is True


def test_customer_cannot_access_seller_conversations(
    client: TestClient,
    customer_headers: dict,
    seller_headers: dict,
    store_id: int,
):
    create = client.post(
        "/api/v1/customer/conversations",
        headers=customer_headers,
        json={"store_id": store_id},
    )
    conversation_id = create.json()["id"]

    response = client.get(
        f"/api/v1/seller/conversations/{conversation_id}",
        headers=customer_headers,
    )
    assert response.status_code == 401


def test_other_seller_cannot_access_conversation(
    client: TestClient,
    customer_headers: dict,
    seller_headers: dict,
    store_id: int,
):
    from tests.conftest import register_seller

    other_seller = register_seller(
        client,
        email="seller-b@example.com",
        full_name="Seller B",
    )

    create = client.post(
        "/api/v1/customer/conversations",
        headers=customer_headers,
        json={"store_id": store_id},
    )
    conversation_id = create.json()["id"]

    response = client.get(
        f"/api/v1/seller/conversations/{conversation_id}",
        headers=other_seller,
    )
    assert response.status_code == 404
