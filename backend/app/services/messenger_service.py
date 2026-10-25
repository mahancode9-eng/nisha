"""Platform Telegram / Bale bots for seller order alerts.

Sellers link a chat via a signed deep-link token. Outbound messages go through
the notification outbox (`telegram` / `bale` channels). Basic+ plans may get
receipt photos and Confirm/Reject inline buttons.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import secrets
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Literal
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.order import Order, PaymentProof
from app.models.store import Store
from app.models.user import User
from app.services import entitlement_service, notification_service, private_media_service
from app.services.exceptions import ServiceError

logger = logging.getLogger(__name__)

Channel = Literal["telegram", "bale"]

MESSENGER_TEMPLATE_ORDER = "seller_messenger_order"
MESSENGER_TEMPLATE_RECEIPT = "seller_messenger_receipt"


def _api_base(channel: Channel) -> str | None:
    if channel == "telegram":
        token = (settings.TELEGRAM_BOT_TOKEN or "").strip()
        if not token:
            return None
        return f"https://api.telegram.org/bot{token}"
    token = (settings.BALE_BOT_TOKEN or "").strip()
    if not token:
        return None
    return f"https://tapi.bale.ai/bot{token}"


def channel_configured(channel: Channel) -> bool:
    return _api_base(channel) is not None


def bot_username(channel: Channel) -> str:
    if channel == "telegram":
        return (settings.TELEGRAM_BOT_USERNAME or "").lstrip("@")
    return (settings.BALE_BOT_USERNAME or "").lstrip("@")


def _sign_link_payload(payload: str) -> str:
    secret = settings.JWT_SECRET_KEY.encode("utf-8")
    return hmac.new(secret, payload.encode("utf-8"), hashlib.sha256).hexdigest()


def create_link_token(store_id: int, channel: Channel) -> str:
    exp = int(time.time()) + max(60, int(settings.MESSENGER_LINK_TOKEN_EXPIRE_MINUTES) * 60)
    nonce = secrets.token_urlsafe(8)
    body = f"{store_id}:{channel}:{exp}:{nonce}"
    return f"{body}:{_sign_link_payload(body)}"


def parse_link_token(token: str) -> tuple[int, Channel]:
    parts = (token or "").strip().split(":")
    if len(parts) != 5:
        raise ServiceError("لینک اتصال نامعتبره. دوباره از پنل وصل کن.", status_code=400)
    store_id_s, channel, exp_s, _nonce, signature = parts
    if channel not in ("telegram", "bale"):
        raise ServiceError("لینک اتصال نامعتبره.", status_code=400)
    body = f"{store_id_s}:{channel}:{exp_s}:{_nonce}"
    expected = _sign_link_payload(body)
    if not hmac.compare_digest(expected, signature):
        raise ServiceError("لینک اتصال نامعتبره.", status_code=400)
    try:
        exp = int(exp_s)
        store_id = int(store_id_s)
    except ValueError as exc:
        raise ServiceError("لینک اتصال نامعتبره.", status_code=400) from exc
    if exp < int(time.time()):
        raise ServiceError("لینک اتصال منقضی شده. دوباره از پنل وصل کن.", status_code=400)
    return store_id, channel  # type: ignore[return-value]


def build_connect_deep_link(store_id: int, channel: Channel) -> str:
    if not channel_configured(channel):
        raise ServiceError(
            "ربات این کانال هنوز تنظیم نشده. بعداً دوباره امتحان کن.",
            status_code=503,
        )
    username = bot_username(channel)
    if not username:
        raise ServiceError(
            "نام ربات تنظیم نشده. با پشتیبانی نیشا تماس بگیر.",
            status_code=503,
        )
    token = create_link_token(store_id, channel)
    start = quote(f"link_{token}", safe="")
    if channel == "telegram":
        return f"https://t.me/{username}?start={start}"
    return f"https://ble.ir/{username}?start={start}"


def bind_chat(db: Session, *, store_id: int, channel: Channel, chat_id: str) -> Store:
    store = db.get(Store, store_id)
    if store is None:
        raise ServiceError("فروشگاه پیدا نشد", status_code=404)
    now = datetime.now(timezone.utc)
    chat_id = str(chat_id).strip()
    if not chat_id:
        raise ServiceError("شناسه چت نامعتبره.", status_code=400)
    if channel == "telegram":
        store.telegram_chat_id = chat_id
        store.telegram_linked_at = now
    else:
        store.bale_chat_id = chat_id
        store.bale_linked_at = now
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


def unbind_chat(db: Session, store: Store, channel: Channel) -> Store:
    if channel == "telegram":
        store.telegram_chat_id = None
        store.telegram_linked_at = None
    else:
        store.bale_chat_id = None
        store.bale_linked_at = None
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


def _seller_order_url(order_id: int) -> str:
    base = (settings.FRONTEND_BASE_URL or "").rstrip("/")
    return f"{base}/seller/orders/{order_id}"


def _absolute_proof_url(image_url: str) -> str | None:
    if not image_url:
        return None
    api_base = (settings.API_PUBLIC_BASE_URL or "").rstrip("/")
    if private_media_service.is_private_media_path(image_url):
        key = private_media_service.extract_private_key(image_url)
        if not key or not api_base:
            return None
        token = private_media_service.create_media_access_token(key, minutes=60)
        return f"{api_base}{private_media_service.PRIVATE_MEDIA_PREFIX}{quote(key)}?token={token}"
    if image_url.startswith("http://") or image_url.startswith("https://"):
        return image_url
    if api_base:
        return f"{api_base}{image_url}" if image_url.startswith("/") else f"{api_base}/{image_url}"
    return None


def _latest_proof_url(db: Session, order: Order) -> str | None:
    proof = db.scalar(
        select(PaymentProof)
        .where(PaymentProof.order_id == order.id)
        .order_by(PaymentProof.id.desc())
        .limit(1)
    )
    if proof is None:
        return None
    return _absolute_proof_url(proof.image_url)


def enqueue_seller_messenger(
    db: Session,
    *,
    store: Store,
    order: Order,
    kind: Literal["order", "receipt"],
) -> None:
    """Enqueue telegram/bale outbox rows when the store has linked chats."""
    entitlements = entitlement_service.get_seller_entitlements(db, store.owner_id)
    include_actions = bool(entitlements.get("messenger_receipt_actions")) and kind == "receipt"
    order_url = _seller_order_url(order.id)
    if kind == "order":
        text = f"سفارش جدید\n{order_url}"
        template = MESSENGER_TEMPLATE_ORDER
        photo_url = None
    else:
        text = f"رسید جدید\n{order_url}"
        template = MESSENGER_TEMPLATE_RECEIPT
        photo_url = _latest_proof_url(db, order) if include_actions else None

    payload = {
        "text": text,
        "order_id": order.id,
        "order_url": order_url,
        "include_actions": include_actions,
        "photo_url": photo_url or "",
    }

    targets: list[tuple[str, str | None]] = [
        ("telegram", store.telegram_chat_id),
        ("bale", store.bale_chat_id),
    ]
    for channel, chat_id in targets:
        if not chat_id or not channel_configured(channel):  # type: ignore[arg-type]
            continue
        notification_service.enqueue_messenger(
            db,
            channel=channel,  # type: ignore[arg-type]
            chat_id=chat_id,
            template=template,
            payload=payload,
        )


def _http_json(method: str, url: str, body: dict[str, Any]) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Messenger HTTP {exc.code}: {detail}") from exc


def send_messenger_message(channel: Channel, chat_id: str, payload: dict[str, Any]) -> None:
    base = _api_base(channel)
    if base is None:
        raise RuntimeError(f"{channel} bot token not configured")

    text = str(payload.get("text") or "")
    include_actions = bool(payload.get("include_actions"))
    order_id = payload.get("order_id")
    photo_url = str(payload.get("photo_url") or "") or None

    reply_markup = None
    if include_actions and order_id is not None:
        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "تایید پرداخت", "callback_data": f"confirm:{order_id}"},
                    {"text": "رد رسید", "callback_data": f"reject:{order_id}"},
                ]
            ]
        }

    if photo_url and include_actions:
        body: dict[str, Any] = {
            "chat_id": chat_id,
            "photo": photo_url,
            "caption": text,
        }
        if reply_markup:
            body["reply_markup"] = reply_markup
        _http_json("POST", f"{base}/sendPhoto", body)
        return

    body = {"chat_id": chat_id, "text": text}
    if reply_markup:
        body["reply_markup"] = reply_markup
    _http_json("POST", f"{base}/sendMessage", body)


def answer_callback(channel: Channel, callback_query_id: str, text: str) -> None:
    base = _api_base(channel)
    if base is None:
        return
    try:
        _http_json(
            "POST",
            f"{base}/answerCallbackQuery",
            {"callback_query_id": callback_query_id, "text": text, "show_alert": False},
        )
    except Exception:  # noqa: BLE001
        logger.exception("Failed to answer %s callback", channel)


def handle_bot_update(db: Session, channel: Channel, update: dict[str, Any]) -> dict[str, str]:
    """Process a Telegram/Bale update (link /start or confirm/reject callback)."""
    message = update.get("message") or update.get("edited_message")
    if isinstance(message, dict):
        text = str(message.get("text") or "").strip()
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if text.startswith("/start") and chat_id is not None:
            parts = text.split(maxsplit=1)
            arg = parts[1].strip() if len(parts) > 1 else ""
            if arg.startswith("link_"):
                token = arg[len("link_") :]
                store_id, token_channel = parse_link_token(token)
                if token_channel != channel:
                    raise ServiceError("لینک برای این ربات نیست.", status_code=400)
                bind_chat(db, store_id=store_id, channel=channel, chat_id=str(chat_id))
                send_messenger_message(
                    channel,
                    str(chat_id),
                    {"text": "وصل شد. از این به بعد سفارش‌ها و رسیدها اینجا میان."},
                )
                return {"status": "linked"}
        return {"status": "ignored"}

    callback = update.get("callback_query")
    if isinstance(callback, dict):
        from app.services import seller_order_service

        data = str(callback.get("data") or "")
        cq_id = str(callback.get("id") or "")
        from_chat = ((callback.get("message") or {}).get("chat") or {}).get("id")
        chat_id = str(from_chat) if from_chat is not None else None
        if not chat_id or ":" not in data:
            answer_callback(channel, cq_id, "درخواست نامعتبر")
            return {"status": "ignored"}
        action, order_id_s = data.split(":", 1)
        try:
            order_id = int(order_id_s)
        except ValueError:
            answer_callback(channel, cq_id, "سفارش نامعتبر")
            return {"status": "ignored"}

        store = _store_for_chat(db, channel, chat_id)
        if store is None:
            answer_callback(channel, cq_id, "این چت به فروشگاهی وصل نیست")
            return {"status": "unauthorized"}

        entitlements = entitlement_service.get_seller_entitlements(db, store.owner_id)
        if not entitlements.get("messenger_receipt_actions"):
            answer_callback(channel, cq_id, "این دکمه تو پلن فعلی‌ت فعال نیست")
            return {"status": "forbidden"}

        seller = db.get(User, store.owner_id)
        if seller is None:
            answer_callback(channel, cq_id, "فروشنده پیدا نشد")
            return {"status": "error"}
        try:
            if action == "confirm":
                seller_order_service.confirm_payment(db, store, order_id, seller)
                answer_callback(channel, cq_id, "پرداخت تایید شد")
                return {"status": "confirmed"}
            if action == "reject":
                seller_order_service.reject_payment(db, store, order_id, seller)
                answer_callback(channel, cq_id, "رسید رد شد")
                return {"status": "rejected"}
        except ServiceError as exc:
            answer_callback(channel, cq_id, exc.message[:180])
            return {"status": "error"}
        answer_callback(channel, cq_id, "اقدام نامعتبر")
        return {"status": "ignored"}

    return {"status": "ignored"}


def _store_for_chat(db: Session, channel: Channel, chat_id: str) -> Store | None:
    if channel == "telegram":
        return db.scalar(select(Store).where(Store.telegram_chat_id == chat_id))
    return db.scalar(select(Store).where(Store.bale_chat_id == chat_id))


def verify_webhook_secret(channel: Channel, provided: str | None) -> bool:
    expected = (
        settings.TELEGRAM_WEBHOOK_SECRET
        if channel == "telegram"
        else settings.BALE_WEBHOOK_SECRET
    ).strip()
    if not expected:
        # In development, allow unauthenticated webhooks when secret unset.
        return settings.ENVIRONMENT != "production"
    return bool(provided) and hmac.compare_digest(expected, provided or "")
