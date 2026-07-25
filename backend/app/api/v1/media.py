"""Authenticated / signed access to private uploads (payment & subscription proofs)."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import UserRole
from app.models.order import Order, PaymentProof
from app.models.store import Store
from app.models.subscription import SubscriptionInvoice, SubscriptionPaymentProof
from app.models.user import User
from app.services.private_media_service import (
    decode_media_access_token,
    resolve_private_file,
)

router = APIRouter(prefix="/media/private", tags=["private-media"])


def _content_type_for(path: Path) -> str:
    suffix = path.suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(suffix, "application/octet-stream")


def _user_may_access_key(db: Session, user: User, key: str) -> bool:
    if user.role == UserRole.ADMIN:
        return True

    proofs = db.query(PaymentProof).filter(PaymentProof.image_url.contains(key)).all()
    for proof in proofs:
        order = db.get(Order, proof.order_id)
        if order is None:
            continue
        store = db.get(Store, order.store_id)
        if store is not None and store.owner_id == user.id:
            return True

    sub_proofs = (
        db.query(SubscriptionPaymentProof)
        .filter(SubscriptionPaymentProof.image_url.contains(key))
        .all()
    )
    for proof in sub_proofs:
        invoice = db.get(SubscriptionInvoice, proof.invoice_id)
        if invoice is not None and invoice.seller_user_id == user.id:
            return True
    return False


@router.get("/{key:path}")
def get_private_media(
    key: str,
    request: Request,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> FileResponse:
    if token:
        try:
            token_key = decode_media_access_token(token)
        except ValueError as exc:
            raise HTTPException(status_code=401, detail="Invalid or expired media token") from exc
        if token_key != key:
            raise HTTPException(status_code=401, detail="Invalid or expired media token")
    else:
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authentication required")
        from app.core.security import decode_access_token

        try:
            payload = decode_access_token(auth.split(" ", 1)[1])
            if payload.get("role") == "CUSTOMER":
                raise HTTPException(status_code=403, detail="Forbidden")
            user_id = int(payload.get("sub", ""))
        except (ValueError, TypeError, HTTPException):
            raise HTTPException(status_code=401, detail="Authentication required") from None
        user = db.get(User, user_id)
        if user is None or not user.is_active:
            raise HTTPException(status_code=401, detail="Authentication required")
        if not _user_may_access_key(db, user, key):
            raise HTTPException(status_code=403, detail="Forbidden")

    path = resolve_private_file(key)
    if path is None:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type=_content_type_for(path))
