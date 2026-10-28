from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer_tag import CustomerTag, CustomerTagLink
from app.models.store import Store
from app.schemas.customer_tag import CustomerTagCreate, CustomerTagUpdate
from app.services.entitlement_service import require_entitlement
from app.services.exceptions import ServiceError


def _require_tags(db: Session, store: Store) -> None:
    require_entitlement(
        db,
        store.owner_id,
        "customer_tags",
        message="برچسب مشتری تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )


def list_tags(db: Session, store: Store) -> list[CustomerTag]:
    return list(
        db.scalars(
            select(CustomerTag)
            .where(CustomerTag.store_id == store.id)
            .order_by(CustomerTag.name)
        ).all()
    )


def create_tag(db: Session, store: Store, data: CustomerTagCreate) -> CustomerTag:
    _require_tags(db, store)
    tag = CustomerTag(
        store_id=store.id,
        name=data.name.strip(),
        color=(data.color or "").strip() or None,
    )
    db.add(tag)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("این برچسب قبلاً ثبت شده", status_code=409) from exc
    db.refresh(tag)
    return tag


def update_tag(
    db: Session,
    store: Store,
    tag_id: int,
    data: CustomerTagUpdate,
) -> CustomerTag:
    _require_tags(db, store)
    tag = db.scalar(
        select(CustomerTag).where(
            CustomerTag.id == tag_id,
            CustomerTag.store_id == store.id,
        )
    )
    if tag is None:
        raise ServiceError("برچسب پیدا نشد", status_code=404)
    update_data = data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = update_data["name"].strip()
    if "color" in update_data and update_data["color"] is not None:
        update_data["color"] = update_data["color"].strip() or None
    for field, value in update_data.items():
        setattr(tag, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("این برچسب قبلاً ثبت شده", status_code=409) from exc
    db.refresh(tag)
    return tag


def delete_tag(db: Session, store: Store, tag_id: int) -> None:
    _require_tags(db, store)
    tag = db.scalar(
        select(CustomerTag).where(
            CustomerTag.id == tag_id,
            CustomerTag.store_id == store.id,
        )
    )
    if tag is None:
        raise ServiceError("برچسب پیدا نشد", status_code=404)
    db.delete(tag)
    db.commit()


def set_customer_tags(
    db: Session,
    store: Store,
    customer_key: str,
    tag_ids: list[int],
) -> list[CustomerTag]:
    _require_tags(db, store)
    key = customer_key.strip()
    if not key:
        raise ServiceError("مشتری پیدا نشد", status_code=404)

    unique_ids = list(dict.fromkeys(tag_ids))
    tags: list[CustomerTag] = []
    if unique_ids:
        tags = list(
            db.scalars(
                select(CustomerTag).where(
                    CustomerTag.store_id == store.id,
                    CustomerTag.id.in_(unique_ids),
                )
            ).all()
        )
        if len(tags) != len(unique_ids):
            raise ServiceError("برچسب پیدا نشد", status_code=404)

    db.execute(
        delete(CustomerTagLink).where(
            CustomerTagLink.store_id == store.id,
            CustomerTagLink.customer_key == key,
        )
    )
    for tag in tags:
        db.add(
            CustomerTagLink(
                store_id=store.id,
                customer_key=key,
                tag_id=tag.id,
            )
        )
    db.commit()
    return tags


def tags_for_keys(
    db: Session,
    store_id: int,
    keys: list[str],
) -> dict[str, list[CustomerTag]]:
    if not keys:
        return {}
    rows = db.execute(
        select(CustomerTagLink.customer_key, CustomerTag)
        .join(CustomerTag, CustomerTag.id == CustomerTagLink.tag_id)
        .where(
            CustomerTagLink.store_id == store_id,
            CustomerTagLink.customer_key.in_(keys),
        )
        .order_by(CustomerTag.name)
    ).all()
    out: dict[str, list[CustomerTag]] = {key: [] for key in keys}
    for customer_key, tag in rows:
        out.setdefault(str(customer_key), []).append(tag)
    return out


def keys_for_tag(db: Session, store_id: int, tag_id: int) -> set[str]:
    rows = db.scalars(
        select(CustomerTagLink.customer_key).where(
            CustomerTagLink.store_id == store_id,
            CustomerTagLink.tag_id == tag_id,
        )
    ).all()
    return {str(key) for key in rows}
