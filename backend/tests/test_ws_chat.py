"""Tests for the realtime chat WebSocket endpoints (roadmap task 13)."""

import pytest
from starlette.websockets import WebSocketDisconnect


def _order_ticket(client, invoice_code: str, password: str) -> str:
    response = client.post(
        "/api/v1/ws/tickets/order",
        json={"invoice_code": invoice_code, "invoice_edit_password": password},
    )
    assert response.status_code == 200
    return response.json()["ticket"]


def _seller_ticket(client, headers: dict) -> str:
    response = client.post("/api/v1/ws/tickets/seller", headers=headers)
    assert response.status_code == 200
    return response.json()["ticket"]


def _order_ws_url(invoice_code: str, ticket: str) -> str:
    return "/api/v1/ws/orders/" + invoice_code + "?ticket=" + ticket


def test_guest_ws_rejects_wrong_password(client, placed_order):
    response = client.post(
        "/api/v1/ws/tickets/order",
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_edit_password": "wrong-password",
        },
    )
    assert response.status_code == 401


def test_seller_ws_rejects_invalid_ticket(client):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/v1/ws/seller?ticket=not-a-ticket") as ws:
            ws.receive_json()


def test_guest_receives_seller_message_live(client, seller_headers, placed_order):
    ticket = _order_ticket(
        client, placed_order["invoice_code"], placed_order["password"]
    )
    url = _order_ws_url(placed_order["invoice_code"], ticket)
    with client.websocket_connect(url) as ws:
        ready = ws.receive_json()
        assert ready["type"] == "ready"
        conversation_id = ready["conversation_id"]

        ws.send_json({"action": "ping"})
        assert ws.receive_json()["type"] == "pong"

        response = client.post(
            "/api/v1/seller/conversations/" + str(conversation_id) + "/messages",
            json={"body": "سلام، سفارش شما آماده است"},
            headers=seller_headers,
        )
        assert response.status_code == 200

        event = ws.receive_json()
        assert event["type"] == "message.new"
        assert event["conversation_id"] == conversation_id
        assert event["message"]["body"] == "سلام، سفارش شما آماده است"


def test_ws_ticket_is_single_use(client, placed_order):
    ticket = _order_ticket(
        client, placed_order["invoice_code"], placed_order["password"]
    )
    url = _order_ws_url(placed_order["invoice_code"], ticket)
    with client.websocket_connect(url) as ws:
        assert ws.receive_json()["type"] == "ready"

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(url) as ws:
            ws.receive_json()


def test_seller_ws_subscribe_access_control(
    client, seller_headers, other_seller_headers, placed_order
):
    # Create the conversation through the guest socket first.
    guest_ticket = _order_ticket(
        client, placed_order["invoice_code"], placed_order["password"]
    )
    url = _order_ws_url(placed_order["invoice_code"], guest_ticket)
    with client.websocket_connect(url) as guest_ws:
        conversation_id = guest_ws.receive_json()["conversation_id"]

    own_ticket = _seller_ticket(client, seller_headers)
    other_ticket = _seller_ticket(client, other_seller_headers)

    with client.websocket_connect("/api/v1/ws/seller?ticket=" + own_ticket) as ws:
        assert ws.receive_json()["type"] == "ready"
        ws.send_json({"action": "subscribe", "conversation_id": conversation_id})
        assert ws.receive_json()["type"] == "subscribed"

    with client.websocket_connect("/api/v1/ws/seller?ticket=" + other_ticket) as ws:
        assert ws.receive_json()["type"] == "ready"
        ws.send_json({"action": "subscribe", "conversation_id": conversation_id})
        assert ws.receive_json()["type"] == "error"
