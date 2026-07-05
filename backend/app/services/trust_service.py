from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import StoreBadgeType
from app.models.store import Store, StoreTrustBadge, StoreTrustBadgeHistory
from app.models.user import User
from app.services.exceptions import ServiceError


def list_active_badges(db: Session, store_id: int) -> list[StoreTrustBadge]:
    return list(
        db.scalars(
            select(StoreTrustBadge)
            .where(StoreTrustBadge.store_id == store_id, StoreTrustBadge.is_active.is_(True))
            .order_by(StoreTrustBadge.badge_type)
        ).all()
    )


def list_badge_history(db: Session, store_id: int) -> list[StoreTrustBadgeHistory]:
    return list(
        db.scalars(
            select(StoreTrustBadgeHistory)
            .where(StoreTrustBadgeHistory.store_id == store_id)
            .order_by(StoreTrustBadgeHistory.created_at.desc())
        ).all()
    )


def _get_badge(db: Session, store_id: int, badge_type: StoreBadgeType) -> StoreTrustBadge | None:
    return db.scalar(
        select(StoreTrustBadge).where(
            StoreTrustBadge.store_id == store_id,
            StoreTrustBadge.badge_type == badge_type,
        )
    )


def set_badge_state(
    db: Session,
    store: Store,
    badge_type: StoreBadgeType,
    *,
    is_active: bool,
    admin: User,
    note: str | None = None,
) -> StoreTrustBadge:
    badge = _get_badge(db, store.id, badge_type)
    now = datetime.now(UTC)
    if badge is None:
        badge = StoreTrustBadge(
            store_id=store.id,
            badge_type=badge_type,
            is_active=is_active,
            assigned_by_user_id=admin.id if is_active else None,
            assigned_at=now if is_active else None,
            removed_at=None if is_active else now,
        )
        db.add(badge)
    else:
        badge.is_active = is_active
        if is_active:
            badge.assigned_by_user_id = admin.id
            badge.assigned_at = now
            badge.removed_at = None
        else:
            badge.removed_at = now

    db.add(
        StoreTrustBadgeHistory(
            store_id=store.id,
            badge_type=badge_type,
            action="ASSIGN" if is_active else "REMOVE",
            note=note,
            admin_user_id=admin.id,
        )
    )
    db.commit()
    db.refresh(badge)
    return badge


def assign_badge(
    db: Session,
    store: Store,
    badge_type: StoreBadgeType,
    *,
    admin: User,
    note: str | None = None,
) -> StoreTrustBadge:
    return set_badge_state(db, store, badge_type, is_active=True, admin=admin, note=note)


def remove_badge(
    db: Session,
    store: Store,
    badge_type: StoreBadgeType,
    *,
    admin: User,
    note: str | None = None,
) -> StoreTrustBadge:
    badge = _get_badge(db, store.id, badge_type)
    if badge is None:
        raise ServiceError("Badge not found", status_code=404)
    return set_badge_state(db, store, badge_type, is_active=False, admin=admin, note=note)
