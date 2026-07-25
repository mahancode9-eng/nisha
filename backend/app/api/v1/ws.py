"""WebSocket endpoints for realtime chat (roadmap task 13).

Endpoints (all under /api/v1/ws):
- POST /ws/tickets/seller     -> short-lived one-time ticket (Bearer seller JWT)
- POST /ws/tickets/customer   -> short-lived one-time ticket (Bearer customer JWT)
- POST /ws/tickets/order      -> short-lived one-time ticket (invoice + password)
- /ws/seller?ticket=...       seller panel (badge + subscriptions)
- /ws/customer?ticket=...     customer portal (badge + subscriptions)
- /ws/orders/{invoice_code}?ticket=...  guest order chat (auto-subscribed)

Sensitive credentials must NOT appear in the WebSocket URL/query string.
"""

from __future__ import annotations

import asyncio
from typing import Callable

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_customer, require_seller
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.services import chat_service, order_access_service
from app.services.chat_realtime import manager
from app.services.exceptions import ServiceError
from app.services.private_media_service import consume_ws_ticket, create_ws_ticket

router = APIRouter(prefix="/ws", tags=["websocket-chat"])

WS_UNAUTHORIZED = 4401


class WsTicketResponse(BaseModel):
    ticket: str
    expires_in: int = 60


class OrderWsTicketRequest(BaseModel):
    invoice_code: str = Field(min_length=1, max_length=50)
    invoice_edit_password: str = Field(min_length=1, max_length=100)


@router.post("/tickets/seller", response_model=WsTicketResponse)
def issue_seller_ws_ticket(
    seller: User = Depends(require_seller),
) -> WsTicketResponse:
    if seller.store is None:
        raise HTTPException(status_code=404, detail="فروشگاه پیدا نشد")
    ticket = create_ws_ticket({"purpose": "seller", "store_id": seller.store.id})
    return WsTicketResponse(ticket=ticket)


@router.post("/tickets/customer", response_model=WsTicketResponse)
def issue_customer_ws_ticket(
    customer: CustomerAccount = Depends(get_current_customer),
) -> WsTicketResponse:
    ticket = create_ws_ticket({"purpose": "customer", "customer_id": customer.id})
    return WsTicketResponse(ticket=ticket)


@router.post("/tickets/order", response_model=WsTicketResponse)
def issue_order_ws_ticket(
    payload: OrderWsTicketRequest,
    db: Session = Depends(get_db),
) -> WsTicketResponse:
    try:
        order = order_access_service.authenticate_order(
            db, payload.invoice_code, payload.invoice_edit_password
        )
        conversation = chat_service.get_or_create_conversation(
            db,
            order_id=order.id,
            customer_id=order.customer_id,
            store_id=order.store_id,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    ticket = create_ws_ticket(
        {
            "purpose": "order",
            "invoice_code": order.invoice_code,
            "conversation_id": conversation.id,
        }
    )
    return WsTicketResponse(ticket=ticket)


def _seller_can_access(db: Session, conversation_id: int, store_id: int) -> bool:
    conversation = db.get(Conversation, conversation_id)
    return conversation is not None and conversation.store_id == store_id


def _customer_can_access(db: Session, conversation_id: int, customer_id: int) -> bool:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None:
        return False
    if conversation.customer_id == customer_id:
        return True
    if conversation.order_id is None:
        return False
    order = db.get(Order, conversation.order_id)
    return order is not None and order.customer_id == customer_id


async def _client_loop(
    websocket: WebSocket,
    *,
    can_subscribe: Callable[[int], bool],
) -> None:
    """Shared receive loop: ping/pong and conversation (un)subscriptions."""
    try:
        while True:
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                raise
            except Exception:  # noqa: BLE001 - malformed frame from client
                await websocket.send_json({"type": "error", "detail": "invalid_json"})
                continue

            action = data.get("action") if isinstance(data, dict) else None
            if action == "ping":
                await websocket.send_json({"type": "pong"})
            elif action in ("subscribe", "unsubscribe"):
                conversation_id = data.get("conversation_id")
                if not isinstance(conversation_id, int):
                    await websocket.send_json(
                        {"type": "error", "detail": "conversation_id_must_be_int"}
                    )
                    continue
                if action == "unsubscribe":
                    manager.unsubscribe_conversation(conversation_id, websocket)
                    await websocket.send_json(
                        {"type": "unsubscribed", "conversation_id": conversation_id}
                    )
                    continue
                allowed = await run_in_threadpool(can_subscribe, conversation_id)
                if not allowed:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "detail": "conversation_not_found",
                            "conversation_id": conversation_id,
                        }
                    )
                    continue
                manager.subscribe_conversation(conversation_id, websocket)
                await websocket.send_json(
                    {"type": "subscribed", "conversation_id": conversation_id}
                )
            else:
                await websocket.send_json({"type": "error", "detail": "unknown_action"})
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@router.websocket("/seller")
async def seller_chat_ws(
    websocket: WebSocket,
    ticket: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    await websocket.accept()
    manager.set_loop(asyncio.get_running_loop())
    try:
        claims = consume_ws_ticket(ticket)
    except ValueError:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    if claims.get("purpose") != "seller":
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    store_id = claims.get("store_id")
    if not isinstance(store_id, int):
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    store = await run_in_threadpool(db.get, Store, store_id)
    if store is None:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    manager.register_store(store.id, websocket)
    await websocket.send_json({"type": "ready", "store_id": store.id})
    await _client_loop(
        websocket,
        can_subscribe=lambda conversation_id: _seller_can_access(
            db, conversation_id, store.id
        ),
    )


@router.websocket("/customer")
async def customer_chat_ws(
    websocket: WebSocket,
    ticket: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    await websocket.accept()
    manager.set_loop(asyncio.get_running_loop())
    try:
        claims = consume_ws_ticket(ticket)
    except ValueError:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    if claims.get("purpose") != "customer":
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    customer_id = claims.get("customer_id")
    if not isinstance(customer_id, int):
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    customer = await run_in_threadpool(db.get, CustomerAccount, customer_id)
    if customer is None:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    manager.register_customer(customer.id, websocket)
    await websocket.send_json({"type": "ready", "customer_id": customer.id})
    await _client_loop(
        websocket,
        can_subscribe=lambda conversation_id: _customer_can_access(
            db, conversation_id, customer.id
        ),
    )


@router.websocket("/orders/{invoice_code}")
async def order_chat_ws(
    websocket: WebSocket,
    invoice_code: str,
    ticket: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    await websocket.accept()
    manager.set_loop(asyncio.get_running_loop())
    try:
        claims = consume_ws_ticket(ticket)
    except ValueError:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    if claims.get("purpose") != "order" or claims.get("invoice_code") != invoice_code:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    conversation_id = claims.get("conversation_id")
    if not isinstance(conversation_id, int):
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    conversation = await run_in_threadpool(db.get, Conversation, conversation_id)
    if conversation is None:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    manager.subscribe_conversation(conversation_id, websocket)
    await websocket.send_json({"type": "ready", "conversation_id": conversation_id})
    await _client_loop(
        websocket,
        can_subscribe=lambda requested_id: requested_id == conversation_id,
    )
