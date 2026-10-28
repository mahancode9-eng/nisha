from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.store import Store
from app.models.store_member import StoreActionLog, StoreMember
from app.models.user import User
from app.schemas.store_team import StoreMemberCreate
from app.services.auth_service import normalize_email
from app.services.entitlement_service import require_entitlement
from app.services.exceptions import ServiceError

ALLOWED_ROLES = {"MANAGER", "STAFF"}


def record_store_action(
    db: Session,
    *,
    store_id: int,
    actor_user_id: int | None,
    action: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    note: str | None = None,
) -> None:
    db.add(
        StoreActionLog(
            store_id=store_id,
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            note=note,
        )
    )


def list_members(db: Session, store: Store) -> list[StoreMember]:
    return list(
        db.scalars(
            select(StoreMember)
            .where(StoreMember.store_id == store.id)
            .order_by(StoreMember.id)
        ).all()
    )


def list_action_logs(db: Session, store: Store, *, limit: int = 50) -> list[StoreActionLog]:
    return list(
        db.scalars(
            select(StoreActionLog)
            .where(StoreActionLog.store_id == store.id)
            .order_by(StoreActionLog.created_at.desc())
            .limit(limit)
        ).all()
    )


def invite_member(
    db: Session,
    store: Store,
    actor: User,
    data: StoreMemberCreate,
) -> StoreMember:
    require_entitlement(
        db,
        store.owner_id,
        "store_team",
        message="تیم فروشگاه تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    role = (data.role or "STAFF").upper()
    if role not in ALLOWED_ROLES:
        raise ServiceError("نقش عضو معتبر نیست", status_code=422)
    email = normalize_email(data.email)
    existing_user = db.scalar(select(User).where(User.email == email))
    member = StoreMember(
        store_id=store.id,
        email=email,
        user_id=existing_user.id if existing_user else None,
        role=role,
        invited_by_user_id=actor.id,
        accepted_at=datetime.now(timezone.utc) if existing_user else None,
    )
    db.add(member)
    record_store_action(
        db,
        store_id=store.id,
        actor_user_id=actor.id,
        action="member.invite",
        entity_type="store_member",
        note=email,
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError("این ایمیل قبلاً به تیم اضافه شده", status_code=409) from exc
    db.refresh(member)
    return member


def remove_member(db: Session, store: Store, actor: User, member_id: int) -> None:
    require_entitlement(
        db,
        store.owner_id,
        "store_team",
        message="تیم فروشگاه تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
    )
    member = db.scalar(
        select(StoreMember).where(
            StoreMember.id == member_id,
            StoreMember.store_id == store.id,
        )
    )
    if member is None:
        raise ServiceError("عضو پیدا نشد", status_code=404)
    email = member.email
    db.delete(member)
    record_store_action(
        db,
        store_id=store.id,
        actor_user_id=actor.id,
        action="member.remove",
        entity_type="store_member",
        entity_id=member_id,
        note=email,
    )
    db.commit()
