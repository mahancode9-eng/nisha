"""WebSocket endpoints for realtime chat (roadmap task 13).

Endpoints (all under /api/v1/ws):
- /ws/seller?token=<JWT>                  seller panel (badge + subscriptions)
- /ws/customer?token=<JWT>                customer portal (badge + subscriptions)
- /ws/orders/{invoice_code}?password=...  guest order chat (auto-subscribed)

Protocol (JSON):
- client -> server: {"action": "ping"}
                    {"action": "subscribe", "conversation_id": N}
                    {"action": "unsubscribe", "conversation_id": N}
- server -> client: {"type": "ready", ...}
                    {"type": "pong"}
                    {"type": "subscribed" | "unsubscribed" | "error", ...}
                    {"type": "message.new", "conversation_id": N, "message": {...}}
                    {"type": "unread.bump", "conversation_id": N}

Sending messages stays on the existing REST endpoints, so clients without
WebSocket support keep working via polling (fallback requirement).
"""

from __future__ import annotations

import asyncio
from typing import Callable

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.enums import UserRole
from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.services import chat_service, order_access_service
from app.services.chat_realtime import manager
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/ws", tags=["websocket-chat"])

WS_UNAUTHORIZED = 4401
CUSTOMER_ROLE = "CUSTOMER"


def _get_seller_store_from_token(db: Session, token: str) -> Store | None:
    try:
        payload = decode_access_token(token)
        if payload.get("role") == CUSTOMER_ROLE:
            return None
        user_id = int(payload.get("sub", ""))
    except (ValueError, TypeError):
        return None
    user = db.get(User, user_id)
    if user is None or not user.is_active or user.role != UserRole.SELLER:
        return None
    return user.store


def _get_customer_from_token(db: Session, token: str) -> CustomerAccount | None:
    try:
        payload = decode_access_token(token)
        if payload.get("role") != CUSTOMER_ROLE:
            return None
        customer_id = int(payload.get("sub", ""))
    except (ValueError, TypeError):
        return None
    return db.get(CustomerAccount, customer_id)


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
    token: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    await websocket.accept()
    manager.set_loop(asyncio.get_running_loop())
    store = await run_in_threadpool(_get_seller_store_from_token, db, token)
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
    token: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    await websocket.accept()
    manager.set_loop(asyncio.get_running_loop())
    customer = await run_in_threadpool(_get_customer_from_token, db, token)
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
    password: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    await websocket.accept()
    manager.set_loop(asyncio.get_running_loop())

    def _prepare() -> int | None:
        try:
            order = order_access_service.authenticate_order(db, invoice_code, password)
            conversation = chat_service.get_or_create_conversation(
                db,
                order_id=order.id,
                customer_id=order.customer_id,
                store_id=order.store_id,
            )
            return conversation.id
        except ServiceError:
            return None

    conversation_id = await run_in_threadpool(_prepare)
    if conversation_id is None:
        await websocket.close(code=WS_UNAUTHORIZED)
        return
    manager.subscribe_conversation(conversation_id, websocket)
    await websocket.send_json({"type": "ready", "conversation_id": conversation_id})
    await _client_loop(
        websocket,
        can_subscribe=lambda requested_id: requested_id == conversation_id,
    )
