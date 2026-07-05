from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.enums import StoreBadgeType
from app.models.user import User
from app.schemas.admin import (
    AdminStoreActionResponse,
    AdminStoreBadgeHistoryItem,
    AdminStoreBadgeResponse,
    AdminStoreDetailResponse,
    AdminStoreListItem,
)
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.services.admin_audit_service import record_admin_action
from app.services import admin_store_service
from app.services import trust_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/stores", tags=["admin-stores"])


@router.get("", response_model=PaginatedResponse[AdminStoreListItem])
def list_stores(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AdminStoreListItem]:
    items, total = admin_store_service.list_stores_paginated(db, page=page, page_size=page_size, search=search)
    return build_paginated_response(items, total, page, page_size)


@router.patch("/{store_id}/activate", response_model=AdminStoreActionResponse)
def activate_store(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreActionResponse:
    try:
        store = admin_store_service.set_store_active(db, store_id, is_active=True, admin=_)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreActionResponse(message="فروشگاه فعال شد", store=store)


@router.patch("/{store_id}/deactivate", response_model=AdminStoreActionResponse)
def deactivate_store(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreActionResponse:
    try:
        store = admin_store_service.set_store_active(db, store_id, is_active=False, admin=_)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreActionResponse(message="فروشگاه غیرفعال شد", store=store)


@router.patch("/{store_id}/approve", response_model=AdminStoreActionResponse)
def approve_store(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreActionResponse:
    try:
        store = admin_store_service.set_store_active(db, store_id, is_active=True, admin=_)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreActionResponse(message="فروشگاه تایید شد", store=store)


@router.patch("/{store_id}/suspend", response_model=AdminStoreActionResponse)
def suspend_store(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreActionResponse:
    try:
        store = admin_store_service.set_store_active(db, store_id, is_active=False, admin=_)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreActionResponse(message="فروشگاه تعلیق شد", store=store)


@router.get("/{store_id}", response_model=AdminStoreDetailResponse)
def get_store_detail(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreDetailResponse:
    try:
        return admin_store_service.get_store_detail(db, store_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/{store_id}/badges", response_model=list[AdminStoreBadgeResponse])
def list_store_badges(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminStoreBadgeResponse]:
    store = admin_store_service.get_store_by_id(db, store_id)
    return [
        AdminStoreBadgeResponse(
            badge_type=badge.badge_type,
            is_active=badge.is_active,
            assigned_at=badge.assigned_at,
            removed_at=badge.removed_at,
            assigned_by_user_id=badge.assigned_by_user_id,
        )
        for badge in trust_service.list_active_badges(db, store.id)
    ]


@router.post("/{store_id}/badges/{badge_type}", response_model=AdminStoreBadgeResponse)
def assign_store_badge(
    store_id: int,
    badge_type: StoreBadgeType,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreBadgeResponse:
    try:
        store = admin_store_service.get_store_by_id(db, store_id)
        badge = trust_service.assign_badge(db, store, badge_type, admin=_)
        record_admin_action(
            db,
            admin=_,
            entity_type="store",
            entity_id=store.id,
            action="BADGE_ASSIGN",
            entity_label=store.name,
            details={"badge_type": badge_type.value},
        )
        db.commit()
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreBadgeResponse(
        badge_type=badge.badge_type,
        is_active=badge.is_active,
        assigned_at=badge.assigned_at,
        removed_at=badge.removed_at,
        assigned_by_user_id=badge.assigned_by_user_id,
    )


@router.delete("/{store_id}/badges/{badge_type}", response_model=AdminStoreBadgeResponse)
def remove_store_badge(
    store_id: int,
    badge_type: StoreBadgeType,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminStoreBadgeResponse:
    try:
        store = admin_store_service.get_store_by_id(db, store_id)
        badge = trust_service.remove_badge(db, store, badge_type, admin=_)
        record_admin_action(
            db,
            admin=_,
            entity_type="store",
            entity_id=store.id,
            action="BADGE_REMOVE",
            entity_label=store.name,
            details={"badge_type": badge_type.value},
        )
        db.commit()
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminStoreBadgeResponse(
        badge_type=badge.badge_type,
        is_active=badge.is_active,
        assigned_at=badge.assigned_at,
        removed_at=badge.removed_at,
        assigned_by_user_id=badge.assigned_by_user_id,
    )


@router.get("/{store_id}/badges/history", response_model=list[AdminStoreBadgeHistoryItem])
def list_store_badge_history(
    store_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminStoreBadgeHistoryItem]:
    store = admin_store_service.get_store_by_id(db, store_id)
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
        for item in trust_service.list_badge_history(db, store.id)
    ]
