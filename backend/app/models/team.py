"""Phase 6b: store staff (Pro) and the store audit log."""

from __future__ import annotations

from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin
from app.models.user import User


class StoreRole(str, PyEnum):
    OWNER = "owner"
    ORDER_MANAGER = "order_manager"
    PRODUCT_MANAGER = "product_manager"


class StoreMemberStatus(str, PyEnum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"


class StoreMember(TimestampMixin, Base):
    """Someone the store owner invited by email; linked to their account once accepted."""

    __tablename__ = "store_members"
    __table_args__ = (UniqueConstraint("store_id", "email", name="uq_store_members_store_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[StoreRole] = mapped_column(Enum(StoreRole, native_enum=False), nullable=False)
    status: Mapped[StoreMemberStatus] = mapped_column(
        Enum(StoreMemberStatus, native_enum=False),
        nullable=False,
        default=StoreMemberStatus.PENDING,
        index=True,
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    invite_token_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, unique=True)
    invite_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    invited_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[Optional[User]] = relationship("User", foreign_keys=[user_id])


class StoreAuditLog(Base):
    """Who did what in a store (order confirmations/rejections/cancellations, staff changes)."""

    __tablename__ = "store_audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Kept so the log still reads right after the account is gone.
    actor_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    actor_role: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    order_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    order_invoice: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    details_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
