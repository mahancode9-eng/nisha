"""Short share links for storefront products and stores."""

from __future__ import annotations

import secrets
import string

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.short_link import ShortLink
from app.models.store import Store
from app.services.exceptions import ServiceError
from app.services.public_store_service import get_active_store_by_slug

_CODE_ALPHABET = string.ascii_letters + string.digits


def _new_code(length: int = 8) -> str:
    return "".join(secrets.choice(_CODE_ALPHABET) for _ in range(length))


def get_or_create_product_link(db: Session, *, slug: str, product_id: int) -> ShortLink:
    store = get_active_store_by_slug(db, slug)
    product = db.scalar(
        select(Product).where(
            Product.id == product_id,
            Product.store_id == store.id,
            Product.is_active.is_(True),
        )
    )
    if product is None:
        raise ServiceError("Product not found", status_code=404)

    existing = db.scalar(
        select(ShortLink).where(
            ShortLink.store_id == store.id,
            ShortLink.product_id == product.id,
        )
    )
    if existing is not None:
        return existing

    target_path = f"/store/{store.slug}/products/{product.id}"
    for _ in range(8):
        code = _new_code()
        clash = db.scalar(select(ShortLink.id).where(ShortLink.code == code))
        if clash is not None:
            continue
        row = ShortLink(
            code=code,
            target_path=target_path,
            store_id=store.id,
            product_id=product.id,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    raise ServiceError("Could not allocate short link", status_code=500)


def get_or_create_store_link(db: Session, *, slug: str) -> ShortLink:
    store = get_active_store_by_slug(db, slug)
    existing = db.scalar(
        select(ShortLink).where(
            ShortLink.store_id == store.id,
            ShortLink.product_id.is_(None),
        )
    )
    if existing is not None:
        return existing

    target_path = f"/store/{store.slug}"
    for _ in range(8):
        code = _new_code()
        clash = db.scalar(select(ShortLink.id).where(ShortLink.code == code))
        if clash is not None:
            continue
        row = ShortLink(
            code=code,
            target_path=target_path,
            store_id=store.id,
            product_id=None,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    raise ServiceError("Could not allocate short link", status_code=500)


def resolve_and_hit(db: Session, code: str) -> ShortLink:
    row = db.scalar(select(ShortLink).where(ShortLink.code == code))
    if row is None:
        raise ServiceError("Short link not found", status_code=404)
    row.hit_count = int(row.hit_count or 0) + 1
    db.commit()
    db.refresh(row)
    return row


def build_qr_png(data: str) -> bytes:
    import qrcode

    img = qrcode.make(data)
    from io import BytesIO

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
