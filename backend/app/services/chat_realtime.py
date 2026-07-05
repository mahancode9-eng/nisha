"""In-process realtime chat hub (roadmap task 13).

Holds active WebSocket connections and pushes chat events to them:
- `message.new`   -> to sockets subscribed to a conversation
- `unread.bump`   -> to the counterpart's badge sockets (seller store or
                     customer account) so unread counters update live

Threading model:
- All registration/broadcast mutations run on the event loop thread
  (WebSocket handlers), so no locking is needed.
- `notify_new_message` is the only sync entrypoint; it is called from
  service code running in worker threads and schedules the broadcast onto
  the captured event loop. If no loop is captured (tests, workers, no
  connected clients yet) it is a no-op — REST/polling keeps working.

Scale-out note: with multiple backend processes, events only reach clients
connected to the same process. For horizontal scaling, replace this hub
with a Redis pub/sub fan-out (documented in docs/chat-realtime.md).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ChatConnectionManager:
    def __init__(self) -> None:
        self._loop: asyncio.AbstractEventLoop | None = None
        self._conversations: dict[int, set[WebSocket]] = {}
        self._stores: dict[int, set[WebSocket]] = {}
        self._customers: dict[int, set[WebSocket]] = {}

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    # -- registration (event loop thread only) --------------------------

    def subscribe_conversation(self, conversation_id: int, websocket: WebSocket) -> None:
        self._conversations.setdefault(conversation_id, set()).add(websocket)

    def unsubscribe_conversation(self, conversation_id: int, websocket: WebSocket) -> None:
        sockets = self._conversations.get(conversation_id)
        if sockets is not None:
            sockets.discard(websocket)
            if not sockets:
                self._conversations.pop(conversation_id, None)

    def register_store(self, store_id: int, websocket: WebSocket) -> None:
        self._stores.setdefault(store_id, set()).add(websocket)

    def register_customer(self, customer_id: int, websocket: WebSocket) -> None:
        self._customers.setdefault(customer_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        for mapping in (self._conversations, self._stores, self._customers):
            empty_keys = []
            for key, sockets in mapping.items():
                sockets.discard(websocket)
                if not sockets:
                    empty_keys.append(key)
            for key in empty_keys:
                mapping.pop(key, None)

    # -- broadcasting ----------------------------------------------------

    async def _send_to(self, sockets: set[WebSocket], payload: dict[str, Any]) -> None:
        for websocket in list(sockets):
            try:
                await websocket.send_json(payload)
            except Exception:  # noqa: BLE001 - drop dead sockets silently
                self.disconnect(websocket)

    async def broadcast_new_message(
        self,
        *,
        conversation_id: int,
        store_id: int,
        customer_id: int | None,
        sender_is_customer: bool,
        message: dict[str, Any],
    ) -> None:
        await self._send_to(
            self._conversations.get(conversation_id, set()),
            {
                "type": "message.new",
                "conversation_id": conversation_id,
                "message": message,
            },
        )
        if sender_is_customer:
            badge_sockets = self._stores.get(store_id, set())
        elif customer_id is not None:
            badge_sockets = self._customers.get(customer_id, set())
        else:
            badge_sockets = set()
        if badge_sockets:
            await self._send_to(
                badge_sockets,
                {"type": "unread.bump", "conversation_id": conversation_id},
            )

    def notify_new_message(
        self,
        *,
        conversation_id: int,
        store_id: int,
        customer_id: int | None,
        sender_is_customer: bool,
        message: dict[str, Any],
    ) -> None:
        """Sync entrypoint for service code running in worker threads."""
        loop = self._loop
        if loop is None or loop.is_closed():
            return
        try:
            asyncio.run_coroutine_threadsafe(
                self.broadcast_new_message(
                    conversation_id=conversation_id,
                    store_id=store_id,
                    customer_id=customer_id,
                    sender_is_customer=sender_is_customer,
                    message=message,
                ),
                loop,
            )
        except RuntimeError:
            logger.debug("Realtime broadcast skipped: event loop unavailable")


manager = ChatConnectionManager()
