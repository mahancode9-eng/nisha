from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.services import messenger_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/messenger", tags=["seller-messenger"])


class MessengerChannelRequest(BaseModel):
    channel: str = Field(pattern="^(telegram|bale)$")


class MessengerConnectResponse(BaseModel):
    channel: str
    deep_link: str
    linked: bool
    chat_id: str | None = None


class MessengerStatusResponse(BaseModel):
    telegram_linked: bool
    bale_linked: bool
    telegram_chat_id: str | None = None
    bale_chat_id: str | None = None
    telegram_configured: bool
    bale_configured: bool


@router.get("/status", response_model=MessengerStatusResponse)
def messenger_status(store: Store = Depends(get_seller_store)) -> MessengerStatusResponse:
    return MessengerStatusResponse(
        telegram_linked=bool(store.telegram_chat_id),
        bale_linked=bool(store.bale_chat_id),
        telegram_chat_id=store.telegram_chat_id,
        bale_chat_id=store.bale_chat_id,
        telegram_configured=messenger_service.channel_configured("telegram"),
        bale_configured=messenger_service.channel_configured("bale"),
    )


@router.post("/connect", response_model=MessengerConnectResponse)
def messenger_connect(
    payload: MessengerChannelRequest,
    store: Store = Depends(get_seller_store),
) -> MessengerConnectResponse:
    channel = payload.channel  # type: ignore[assignment]
    try:
        deep_link = messenger_service.build_connect_deep_link(store.id, channel)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    chat_id = store.telegram_chat_id if channel == "telegram" else store.bale_chat_id
    return MessengerConnectResponse(
        channel=channel,
        deep_link=deep_link,
        linked=bool(chat_id),
        chat_id=chat_id,
    )


@router.post("/disconnect", response_model=MessengerStatusResponse)
def messenger_disconnect(
    payload: MessengerChannelRequest,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> MessengerStatusResponse:
    channel = payload.channel  # type: ignore[assignment]
    messenger_service.unbind_chat(db, store, channel)
    db.refresh(store)
    return messenger_status(store)
