from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_context, require_seller
from app.api.service_http import raise_service_error
from app.db.session import get_db
from app.models.store import Store
from app.models.team import StoreMember, StoreMemberStatus, StoreRole
from app.models.user import User
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.schemas.team import (
    AuditEntryResponse,
    InviteAccept,
    MyStoreResponse,
    TeamInviteCreate,
    TeamInviteResponse,
    TeamMemberResponse,
    TeamOverviewResponse,
    TeamRoleUpdate,
)
from app.services import entitlement_service, team_service
from app.services.exceptions import ServiceError
from app.services.team_service import SellerContext

router = APIRouter(prefix="/team", tags=["seller-team"])
# Not behind the "team" area: any seller may accept an invite or list their stores.
self_router = APIRouter(prefix="/team", tags=["seller-team"])


def _member_response(member: StoreMember) -> TeamMemberResponse:
    return TeamMemberResponse(
        id=member.id,
        email=member.email,
        full_name=member.user.full_name if member.user else None,
        role=member.role,
        status=member.status,
        invited_at=member.created_at,
        accepted_at=member.accepted_at,
        invite_expires_at=member.invite_expires_at if member.status == StoreMemberStatus.PENDING else None,
    )


@router.get("", response_model=TeamOverviewResponse)
def get_team(
    ctx: SellerContext = Depends(get_seller_context),
    db: Session = Depends(get_db),
) -> TeamOverviewResponse:
    store: Store = ctx.store
    owner = db.get(User, store.owner_id)
    ents = entitlement_service.get_seller_entitlements(db, store.owner_id)
    members = [
        TeamMemberResponse(
            email=owner.email if owner else "",
            full_name=owner.full_name if owner else None,
            role=StoreRole.OWNER,
            status=StoreMemberStatus.ACTIVE,
            is_store_owner=True,
        )
    ]
    members += [_member_response(m) for m in team_service.list_members(db, store)]
    return TeamOverviewResponse(
        enabled=bool(ents.get("team_members")),
        seats=entitlement_service.get_max_team_members(ents),
        members=members,
    )


@router.post("/invites", response_model=TeamInviteResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    payload: TeamInviteCreate,
    ctx: SellerContext = Depends(get_seller_context),
    db: Session = Depends(get_db),
) -> TeamInviteResponse:
    try:
        member, token = team_service.invite(db, ctx, payload.email, payload.role)
    except ServiceError as exc:
        raise_service_error(exc)
    return TeamInviteResponse(**_member_response(member).model_dump(), accept_url=team_service.accept_url(token))


@router.patch("/members/{member_id}", response_model=TeamMemberResponse)
def change_member_role(
    member_id: int,
    payload: TeamRoleUpdate,
    ctx: SellerContext = Depends(get_seller_context),
    db: Session = Depends(get_db),
) -> TeamMemberResponse:
    try:
        return _member_response(team_service.change_role(db, ctx, member_id, payload.role))
    except ServiceError as exc:
        raise_service_error(exc)


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    member_id: int,
    ctx: SellerContext = Depends(get_seller_context),
    db: Session = Depends(get_db),
) -> None:
    try:
        team_service.remove(db, ctx, member_id)
    except ServiceError as exc:
        raise_service_error(exc)


@router.get("/audit", response_model=PaginatedResponse[AuditEntryResponse])
def get_audit_log(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
    ctx: SellerContext = Depends(get_seller_context),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AuditEntryResponse]:
    rows, total = team_service.list_audit(db, ctx.store, page=page, page_size=page_size)
    items = [
        AuditEntryResponse(
            id=row.id,
            actor_name=row.actor_name,
            actor_role=row.actor_role,
            action=row.action,
            order_id=row.order_id,
            order_invoice=row.order_invoice,
            details=row.details_text,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return build_paginated_response(items, total, page, page_size)


@self_router.post("/accept", response_model=MyStoreResponse)
def accept_invite(
    payload: InviteAccept,
    user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> MyStoreResponse:
    try:
        member = team_service.accept(db, user, payload.token)
    except ServiceError as exc:
        raise_service_error(exc)
    store = db.get(Store, member.store_id)
    return MyStoreResponse(store_id=store.id, name=store.name, slug=store.slug, role=member.role, is_store_owner=False)


@self_router.get("/my-stores", response_model=list[MyStoreResponse])
def list_my_stores(
    user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> list[MyStoreResponse]:
    return [
        MyStoreResponse(store_id=s.id, name=s.name, slug=s.slug, role=role, is_store_owner=owner)
        for s, role, owner in team_service.my_stores(db, user)
    ]
