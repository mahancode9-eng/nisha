from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.store_categories import OTHER_CATEGORY, get_store_category
from app.models.store import Store, StoreSocialLink
from app.schemas.store import StoreSocialLinkInput, StoreUpdate
from app.services.exceptions import ServiceError
from app.utils.slug import is_slug_taken, slugify


def get_store(store: Store) -> Store:
    return store


def list_social_links(db: Session, store: Store) -> list[StoreSocialLink]:
    return list(
        db.scalars(
            select(StoreSocialLink)
            .where(StoreSocialLink.store_id == store.id)
            .order_by(StoreSocialLink.sort_order, StoreSocialLink.id)
        ).all()
    )


def _replace_social_links(db: Session, store: Store, social_links: list[StoreSocialLinkInput]) -> None:
    for link in list(store.social_links):
        db.delete(link)
    db.flush()

    for index, link in enumerate(social_links):
        db.add(
            StoreSocialLink(
                store_id=store.id,
                label=link.label,
                url=link.url,
                icon_key=link.icon_key,
                sort_order=link.sort_order if link.sort_order is not None else index,
                is_active=link.is_active,
            )
        )


def _apply_category_update(store: Store, update_data: dict) -> None:
    category_slug = update_data.pop("category_slug", None)
    category_name = update_data.pop("category_name", None)

    if category_slug is None and category_name is None:
        return

    if category_slug is None:
        if store.category_slug == OTHER_CATEGORY.slug and category_name is not None:
            store.category_name = category_name.strip() or None
            return
        raise ServiceError("Invalid store category", status_code=422)

    category = get_store_category(category_slug)
    if category is None:
        raise ServiceError("Invalid store category", status_code=422)

    store.category_slug = category.slug
    if category.slug == OTHER_CATEGORY.slug:
        if not category_name or not category_name.strip():
            raise ServiceError("Custom category name is required", status_code=422)
        store.category_name = category_name.strip()
    else:
        store.category_name = category.label


def update_store(db: Session, store: Store, data: StoreUpdate) -> Store:
    update_data = data.model_dump(exclude_unset=True)
    social_links = update_data.pop("social_links", None)

    if "slug" in update_data:
        update_data["slug"] = slugify(update_data["slug"])
        if is_slug_taken(db, update_data["slug"], exclude_store_id=store.id):
            raise ServiceError("Slug already taken", status_code=409)

    _apply_category_update(store, update_data)

    for field, value in update_data.items():
        setattr(store, field, value)

    if social_links is not None:
        _replace_social_links(db, store, [StoreSocialLinkInput.model_validate(item) for item in social_links])

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Store update failed due to a constraint conflict", status_code=409) from exc

    db.refresh(store)
    return store


def create_social_link(db: Session, store: Store, data: StoreSocialLinkInput) -> StoreSocialLink:
    link = StoreSocialLink(
        store_id=store.id,
        label=data.label,
        url=data.url,
        icon_key=data.icon_key,
        sort_order=data.sort_order,
        is_active=data.is_active,
    )
    db.add(link)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Could not create social link", status_code=409) from exc
    db.refresh(link)
    return link


def get_social_link(db: Session, store: Store, link_id: int) -> StoreSocialLink:
    link = db.get(StoreSocialLink, link_id)
    if link is None or link.store_id != store.id:
        raise ServiceError("Social link not found", status_code=404)
    return link


def update_social_link(db: Session, store: Store, link_id: int, data: StoreSocialLinkInput) -> StoreSocialLink:
    link = get_social_link(db, store, link_id)
    for field, value in data.model_dump().items():
        setattr(link, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Could not update social link", status_code=409) from exc
    db.refresh(link)
    return link


def delete_social_link(db: Session, store: Store, link_id: int) -> None:
    link = get_social_link(db, store, link_id)
    db.delete(link)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Could not delete social link", status_code=409) from exc


def reorder_social_links(db: Session, store: Store, ordered_ids: list[int]) -> list[StoreSocialLink]:
    links = list_social_links(db, store)
    if len(links) != len(ordered_ids) or {link.id for link in links} != set(ordered_ids):
        raise ServiceError("Invalid social link order", status_code=422)

    by_id = {link.id: link for link in links}
    for index, link_id in enumerate(ordered_ids):
        by_id[link_id].sort_order = index
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("Could not reorder social links", status_code=409) from exc
    return list_social_links(db, store)
