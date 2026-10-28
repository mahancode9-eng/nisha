"""Store staff (Pro): roles, which panel areas each role may use, invites, audit log.

Every seller endpoint belongs to an area (see app/api/v1/seller/__init__.py);
`check_area` is the single place that decides who may use it.
"""

from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.store import Store
from app.models.team import StoreAuditLog, StoreMember, StoreMemberStatus, StoreRole
from app.models.user import User
from app.services import entitlement_service, notification_service
from app.services.auth_service import normalize_email
from app.services.exceptions import ServiceError

INVITE_DAYS = 7

# Areas any role may use. The real owner may use everything; an invited
# "owner" everything except billing.
AREA_ROLES: dict[str, set[StoreRole]] = {
    "dashboard": {StoreRole.OWNER, StoreRole.ORDER_MANAGER, StoreRole.PRODUCT_MANAGER},
    "orders": {StoreRole.OWNER, StoreRole.ORDER_MANAGER},
    "customers": {StoreRole.OWNER, StoreRole.ORDER_MANAGER},
    "conversations": {StoreRole.OWNER, StoreRole.ORDER_MANAGER},
    "products": {StoreRole.OWNER, StoreRole.PRODUCT_MANAGER},
    "store": {StoreRole.OWNER},
    "payments": {StoreRole.OWNER},
    "discounts": {StoreRole.OWNER},
    "analytics": {StoreRole.OWNER},
    "messenger": {StoreRole.OWNER},
    "onboarding": {StoreRole.OWNER},
    "team": {StoreRole.OWNER},
    "domain": {StoreRole.OWNER},
}
# Billing stays with the account that owns the store.
OWNER_ONLY_AREAS = {"subscription"}
# Exports are split by what they contain.
EXPORT_AREAS = {"orders.csv": "orders", "customers.csv": "customers", "products.csv": "products"}

ROLE_LABELS_FA = {
    StoreRole.OWNER: "مالک",
    StoreRole.ORDER_MANAGER: "مدیر سفارش‌ها",
    StoreRole.PRODUCT_MANAGER: "مدیر محصولات",
}


@dataclass(frozen=True)
class SellerContext:
    """The store a seller is working in, and as what."""

    user: User
    store: Store
    role: StoreRole
    # The account that owns the store (not an invited "owner").
    is_store_owner: bool


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _forbidden(message: str = "این بخش برای نقش تو تو این فروشگاه باز نیست.") -> ServiceError:
    return ServiceError(message, status_code=403, code="ROLE_FORBIDDEN")


def _team_rule(message: str) -> ServiceError:
    """A team action the role may reach but this rule doesn't allow (e.g. only the owner manages owners)."""
    return ServiceError(message, status_code=403, code="TEAM_RULE")


def team_enabled(db: Session, store: Store) -> bool:
    return bool(entitlement_service.get_seller_entitlements(db, store.owner_id).get("team_members"))


def _require_team_plan(db: Session, store: Store) -> None:
    if not team_enabled(db, store):
        raise ServiceError(
            "دسترسی تیم (چند کاربر) با پلن حرفه‌ای فعاله.",
            status_code=403,
            code="ENTITLEMENT_REQUIRED",
            meta={"entitlement": "team_members", "upgrade_required": True},
        )


def active_membership(db: Session, user: User, store_id: int) -> StoreMember | None:
    return db.scalar(
        select(StoreMember).where(
            StoreMember.store_id == store_id,
            StoreMember.user_id == user.id,
            StoreMember.status == StoreMemberStatus.ACTIVE,
        )
    )


def resolve_context(db: Session, user: User, store_id: int | None) -> SellerContext:
    """The store [user] acts on: [store_id] if given (own or as staff), else their own."""
    own = user.store
    if store_id is None or (own is not None and own.id == store_id):
        if own is None:
            # A staff-only account: fall back to the first store they work in.
            member = db.scalar(
                select(StoreMember)
                .where(StoreMember.user_id == user.id, StoreMember.status == StoreMemberStatus.ACTIVE)
                .order_by(StoreMember.id)
            )
            if member is None:
                raise ServiceError("فروشگاه پیدا نشد", status_code=404)
            store_id = member.store_id
        else:
            return SellerContext(user=user, store=own, role=StoreRole.OWNER, is_store_owner=True)

    member = active_membership(db, user, store_id)
    store = db.get(Store, store_id) if member else None
    if member is None or store is None:
        raise ServiceError("به این فروشگاه دسترسی نداری.", status_code=403, code="ROLE_FORBIDDEN")
    _require_team_plan(db, store)
    return SellerContext(user=user, store=store, role=member.role, is_store_owner=False)


def check_area(ctx: SellerContext, area: str, path: str = "") -> None:
    if ctx.is_store_owner:
        return
    if area == "exports":
        area = EXPORT_AREAS.get(path.rsplit("/", 1)[-1], "store")
    if area in OWNER_ONLY_AREAS or ctx.role not in AREA_ROLES.get(area, {StoreRole.OWNER}):
        raise _forbidden()


def can_view_store_orders(db: Session, user: User, store: Store) -> bool:
    """Payment receipts and order media: the owner, or staff who handle orders."""
    if store.owner_id == user.id:
        return True
    member = active_membership(db, user, store.id)
    return bool(member and member.role in AREA_ROLES["orders"] and team_enabled(db, store))


# --- Audit log -------------------------------------------------------------


def record(
    db: Session,
    ctx_or_user: SellerContext | User,
    store: Store,
    action: str,
    *,
    order=None,
    details: str | None = None,
) -> None:
    if isinstance(ctx_or_user, SellerContext):
        user, role = ctx_or_user.user, ctx_or_user.role.value
    else:
        user = ctx_or_user
        role = StoreRole.OWNER.value if store.owner_id == user.id else ""
    db.add(
        StoreAuditLog(
            store_id=store.id,
            actor_user_id=user.id,
            actor_name=user.full_name or user.email,
            actor_role=role,
            action=action,
            order_id=getattr(order, "id", None),
            order_invoice=getattr(order, "invoice_code", None),
            details_text=(details or None) and details[:255],
        )
    )
    db.commit()


def list_audit(db: Session, store: Store, *, page: int, page_size: int) -> tuple[list[StoreAuditLog], int]:
    total = db.scalar(select(func.count(StoreAuditLog.id)).where(StoreAuditLog.store_id == store.id)) or 0
    rows = db.scalars(
        select(StoreAuditLog)
        .where(StoreAuditLog.store_id == store.id)
        .order_by(StoreAuditLog.created_at.desc(), StoreAuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return list(rows), int(total)


# --- Members and invites ---------------------------------------------------


def list_members(db: Session, store: Store) -> list[StoreMember]:
    return list(
        db.scalars(
            select(StoreMember)
            .where(StoreMember.store_id == store.id, StoreMember.status != StoreMemberStatus.REVOKED)
            .order_by(StoreMember.id)
        ).all()
    )


def accept_url(token: str) -> str:
    return f"{settings.FRONTEND_BASE_URL.rstrip('/')}/seller/team/accept?token={token}"


def invite(db: Session, ctx: SellerContext, email: str, role: StoreRole) -> tuple[StoreMember, str]:
    """Invite (or re-invite) [email]; returns the member and the one-time token."""
    store = ctx.store
    _require_team_plan(db, store)
    email = normalize_email(email)
    owner = db.get(User, store.owner_id)
    if owner is not None and normalize_email(owner.email) == email:
        raise ServiceError("این ایمیل مال صاحب فروشگاهه.", status_code=422)
    if role == StoreRole.OWNER and not ctx.is_store_owner:
        raise _team_rule("فقط صاحب فروشگاه می‌تونه مالک اضافه کنه.")

    member = db.scalar(select(StoreMember).where(StoreMember.store_id == store.id, StoreMember.email == email))
    if member is None or member.status == StoreMemberStatus.REVOKED:
        seats = entitlement_service.get_max_team_members(
            entitlement_service.get_seller_entitlements(db, store.owner_id)
        )
        used = db.scalar(
            select(func.count(StoreMember.id)).where(
                StoreMember.store_id == store.id, StoreMember.status != StoreMemberStatus.REVOKED
            )
        ) or 0
        if seats is not None and used >= seats:
            raise ServiceError(
                f"پلن فعلی‌ت تا {seats} همکار جا داره.",
                status_code=403,
                code="ENTITLEMENT_REQUIRED",
                meta={"entitlement": "max_team_members", "upgrade_required": True},
            )
    if member is not None and member.status == StoreMemberStatus.ACTIVE:
        raise ServiceError("این آدم الان عضو تیمه.", status_code=409)

    token = secrets.token_urlsafe(32)
    if member is None:
        member = StoreMember(store_id=store.id, email=email)
        db.add(member)
    member.role = role
    member.status = StoreMemberStatus.PENDING
    member.user_id = None
    member.accepted_at = None
    member.invite_token_hash = _hash(token)
    member.invite_expires_at = _now() + timedelta(days=INVITE_DAYS)
    member.invited_by_user_id = ctx.user.id
    db.flush()
    notification_service.enqueue_email(
        db,
        email,
        "team_invite",
        {
            "store_name": store.name,
            "inviter_name": ctx.user.full_name or ctx.user.email,
            "role_label": ROLE_LABELS_FA[role],
            "accept_url": accept_url(token),
            "days": INVITE_DAYS,
        },
    )
    db.commit()
    record(db, ctx, store, "team.invite", details=f"{email} ({ROLE_LABELS_FA[role]})")
    db.refresh(member)
    return member, token


def accept(db: Session, user: User, token: str) -> StoreMember:
    member = db.scalar(select(StoreMember).where(StoreMember.invite_token_hash == _hash(token.strip())))
    if member is None or member.status != StoreMemberStatus.PENDING:
        raise ServiceError("این دعوت معتبر نیست یا قبلاً استفاده شده.", status_code=404)
    expires = member.invite_expires_at
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires is not None and expires < _now():
        raise ServiceError("مهلت این دعوت تموم شده. از صاحب فروشگاه بخواه دوباره دعوتت کنه.", status_code=410)
    if normalize_email(user.email) != member.email:
        raise ServiceError(
            f"این دعوت برای {member.email} فرستاده شده. با همون ایمیل وارد شو.",
            status_code=403,
            code="INVITE_EMAIL_MISMATCH",
        )
    store = db.get(Store, member.store_id)
    if store is None:
        raise ServiceError("فروشگاه پیدا نشد", status_code=404)
    if store.owner_id == user.id:
        raise ServiceError("این فروشگاه خودته.", status_code=422)
    _require_team_plan(db, store)
    member.status = StoreMemberStatus.ACTIVE
    member.user_id = user.id
    member.accepted_at = _now()
    member.invite_token_hash = None
    db.commit()
    record(db, user, store, "team.join", details=ROLE_LABELS_FA[member.role])
    db.refresh(member)
    return member


def _member(db: Session, store: Store, member_id: int) -> StoreMember:
    member = db.get(StoreMember, member_id)
    if member is None or member.store_id != store.id or member.status == StoreMemberStatus.REVOKED:
        raise ServiceError("عضو پیدا نشد", status_code=404)
    return member


def change_role(db: Session, ctx: SellerContext, member_id: int, role: StoreRole) -> StoreMember:
    member = _member(db, ctx.store, member_id)
    if StoreRole.OWNER in (role, member.role) and not ctx.is_store_owner:
        raise _team_rule("فقط صاحب فروشگاه می‌تونه نقش مالک رو بده یا بگیره.")
    if member.user_id == ctx.user.id:
        raise _team_rule("نقش خودت رو نمی‌تونی عوض کنی.")
    old = member.role
    member.role = role
    db.commit()
    record(db, ctx, ctx.store, "team.role", details=f"{member.email}: {ROLE_LABELS_FA[old]} → {ROLE_LABELS_FA[role]}")
    db.refresh(member)
    return member


def remove(db: Session, ctx: SellerContext, member_id: int) -> None:
    member = _member(db, ctx.store, member_id)
    if member.role == StoreRole.OWNER and not ctx.is_store_owner:
        raise _team_rule("فقط صاحب فروشگاه می‌تونه مالک دیگه رو حذف کنه.")
    member.status = StoreMemberStatus.REVOKED
    member.invite_token_hash = None
    db.commit()
    record(db, ctx, ctx.store, "team.remove", details=member.email)


def my_stores(db: Session, user: User) -> list[tuple[Store, StoreRole, bool]]:
    """(store, role, is_store_owner) for the user's own store and every store they work in."""
    out: list[tuple[Store, StoreRole, bool]] = []
    if user.store is not None:
        out.append((user.store, StoreRole.OWNER, True))
    for member in db.scalars(
        select(StoreMember)
        .where(StoreMember.user_id == user.id, StoreMember.status == StoreMemberStatus.ACTIVE)
        .order_by(StoreMember.id)
    ).all():
        store = db.get(Store, member.store_id)
        if store is not None and team_enabled(db, store):
            out.append((store, member.role, False))
    return out
