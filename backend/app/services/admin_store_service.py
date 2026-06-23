from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.models.user import User
from app.schemas.admin import AdminStoreBadgeHistoryItem, AdminStoreBadgeResponse, AdminStoreDetailResponse, AdminStoreListItem
from app.schemas.store import StoreResponse
from app.services.admin_audit_service import list_entity_logs, record_admin_action
from app.services.exceptions import ServiceError
from app.services import trust_service


def _store_list_item_from_row(row) -> AdminStoreListItem:
    return AdminStoreListItem(
        id=row.id,
        name=row.name,
        slug=row.slug,
        owner_email=row.email,
        is_active=row.is_active,
        product_count=row.product_count,
        order_count=row.order_count,
        created_at=row.created_at,
    )


def _stores_query(search: str | None = None):
    product_counts = (
        select(Product.store_id, func.count(Product.id).label("product_count"))
        .group_by(Product.store_id)
        .subquery()
    )
    order_counts = (
        select(Order.store_id, func.count(Order.id).label("order_count"))
        .group_by(Order.store_id)
        .subquery()
    )
    stmt = (
        select(
            Store.id,
            Store.name,
            Store.slug,
            Store.is_active,
            Store.created_at,
            User.email,
            func.coalesce(product_counts.c.product_count, 0).label("product_count"),
            func.coalesce(order_counts.c.order_count, 0).label("order_count"),
        )
        .join(User, Store.owner_id == User.id)
        .outerjoin(product_counts, Store.id == product_counts.c.store_id)
        .outerjoin(order_counts, Store.id == order_counts.c.store_id)
    )
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(Store.name.ilike(term), Store.slug.ilike(term), User.email.ilike(term)))
    return stmt.order_by(Store.created_at.desc())


def list_stores(db: Session, *, search: str | None = None) -> list[AdminStoreListItem]:
    rows = db.execute(_stores_query(search=search)).all()
    return [_store_list_item_from_row(row) for row in rows]


def list_stores_paginated(
    db: Session,
    *,
    page: int,
    page_size: int,
    search: str | None = None,
) -> tuple[list[AdminStoreListItem], int]:
    count_q = select(func.count()).select_from(Store).join(User, Store.owner_id == User.id)
    if search:
        term = f"%{search.strip()}%"
        count_q = count_q.where(or_(Store.name.ilike(term), Store.slug.ilike(term), User.email.ilike(term)))
    total = db.scalar(count_q) or 0
    offset = (page - 1) * page_size
    rows = db.execute(_stores_query(search=search).offset(offset).limit(page_size)).all()
    return [_store_list_item_from_row(row) for row in rows], total


def _load_store(db: Session, store_id: int) -> Store:
    store = db.scalar(
        select(Store)
        .options(
            selectinload(Store.owner),
            selectinload(Store.social_links),
            selectinload(Store.trust_badges),
            selectinload(Store.badge_history),
        )
        .where(Store.id == store_id)
    )
    if store is None:
        raise ServiceError("Store not found", status_code=404)
    return store


def get_store_by_id(db: Session, store_id: int) -> Store:
    return _load_store(db, store_id)


def _counts_for_store(db: Session, store_id: int) -> tuple[int, int]:
    product_count = db.scalar(select(func.count()).select_from(Product).where(Product.store_id == store_id)) or 0
    order_count = db.scalar(select(func.count()).select_from(Order).where(Order.store_id == store_id)) or 0
    return int(product_count), int(order_count)


def _badge_history_responses(store: Store) -> list[AdminStoreBadgeHistoryItem]:
    return [
        AdminStoreBadgeHistoryItem(
            id=item.id,
            store_id=item.store_id,
            badge_type=item.badge_type,
            action=item.action,
            note=item.note,
            admin_user_id=item.admin_user_id,
            created_at=item.created_at,
        )
        for item in store.badge_history
    ]


def get_store_detail(db: Session, store_id: int) -> AdminStoreDetailResponse:
    store = _load_store(db, store_id)
    product_count, order_count = _counts_for_store(db, store.id)
    owner_email = store.owner.email if store.owner else ""
    return AdminStoreDetailResponse(
        store=StoreResponse.model_validate(store),
        owner_email=owner_email,
        product_count=product_count,
        order_count=order_count,
        badges=[
            AdminStoreBadgeResponse(
                badge_type=badge.badge_type,
                is_active=badge.is_active,
                assigned_at=badge.assigned_at,
                removed_at=badge.removed_at,
                assigned_by_user_id=badge.assigned_by_user_id,
            )
            for badge in store.trust_badges
            if badge.is_active
        ],
        badge_history=_badge_history_responses(store),
        audit_logs=list_entity_logs(db, entity_type="store", entity_id=store.id),
    )


def set_store_active(
    db: Session,
    store_id: int,
    *,
    is_active: bool,
    admin: User | None = None,
    note: str | None = None,
) -> AdminStoreListItem:
    store = _load_store(db, store_id)
    store.is_active = is_active
    record_admin_action(
        db,
        admin=admin,
        entity_type="store",
        entity_id=store.id,
        action="ACTIVATE" if is_active else "SUSPEND",
        entity_label=store.name,
        note=note,
        details={"is_active": is_active},
    )
    db.commit()
    db.refresh(store)

    product_count, order_count = _counts_for_store(db, store.id)
    owner_email = store.owner.email if store.owner else ""
    return AdminStoreListItem(
        id=store.id,
        name=store.name,
        slug=store.slug,
        owner_email=owner_email,
        is_active=store.is_active,
        product_count=product_count,
        order_count=order_count,
        created_at=store.created_at,
    )
