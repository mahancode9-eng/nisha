from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.team import StoreMemberStatus, StoreRole


class TeamInviteCreate(BaseModel):
    email: EmailStr
    role: StoreRole


class TeamRoleUpdate(BaseModel):
    role: StoreRole


class TeamMemberResponse(BaseModel):
    id: int | None = None  # None for the store owner
    email: str
    full_name: str | None = None
    role: StoreRole
    status: StoreMemberStatus
    is_store_owner: bool = False
    invited_at: datetime | None = None
    accepted_at: datetime | None = None
    invite_expires_at: datetime | None = None


class TeamInviteResponse(TeamMemberResponse):
    # Shown once to the owner so they can send it themselves if the email doesn't arrive.
    accept_url: str


class TeamOverviewResponse(BaseModel):
    enabled: bool  # the store's plan includes staff accounts
    seats: int | None  # staff seats on the plan; None = unlimited
    members: list[TeamMemberResponse]


class InviteAccept(BaseModel):
    token: str


class MyStoreResponse(BaseModel):
    store_id: int
    name: str
    slug: str
    role: StoreRole
    is_store_owner: bool


class AuditEntryResponse(BaseModel):
    id: int
    actor_name: str
    actor_role: str
    action: str
    order_id: int | None = None
    order_invoice: str | None = None
    details: str | None = None
    created_at: datetime
