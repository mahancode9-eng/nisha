from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import messenger_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _secret_header(
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
    x_bale_bot_api_secret_token: str | None = Header(default=None),
    x_webhook_secret: str | None = Header(default=None),
) -> str | None:
    return x_telegram_bot_api_secret_token or x_bale_bot_api_secret_token or x_webhook_secret


@router.post("/telegram")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_db),
    secret: str | None = Depends(_secret_header),
) -> dict[str, str]:
    if not messenger_service.verify_webhook_secret("telegram", secret):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    update: dict[str, Any] = await request.json()
    try:
        return messenger_service.handle_bot_update(db, "telegram", update)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/bale")
async def bale_webhook(
    request: Request,
    db: Session = Depends(get_db),
    secret: str | None = Depends(_secret_header),
) -> dict[str, str]:
    if not messenger_service.verify_webhook_secret("bale", secret):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    update: dict[str, Any] = await request.json()
    try:
        return messenger_service.handle_bot_update(db, "bale", update)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
