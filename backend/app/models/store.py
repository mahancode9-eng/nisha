from __future__ import annotations

import json
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import StoreBadgeType
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.order import Order
    from app.models.payment_method import PaymentMethod
    from app.models.product import Product
    from app.models.user import User
    from app.models.user import User


class StoreSocialLink(TimestampMixin, Base):
    __tablename__ = "store_social_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    icon_key: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    store: Mapped["Store"] = relationship("Store", back_populates="social_links")


class StoreTrustBadge(TimestampMixin, Base):
    __tablename__ = "store_trust_badges"
    __table_args__ = (UniqueConstraint("store_id", "badge_type", name="uq_store_trust_badges_store_type"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    badge_type: Mapped[StoreBadgeType] = mapped_column(
        Enum(StoreBadgeType, native_enum=False),
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    assigned_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    removed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    store: Mapped["Store"] = relationship("Store", back_populates="trust_badges")
    assigned_by_user: Mapped[Optional["User"]] = relationship("User")


class StoreTrustBadgeHistory(TimestampMixin, Base):
    __tablename__ = "store_trust_badge_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    badge_type: Mapped[StoreBadgeType] = mapped_column(
        Enum(StoreBadgeType, native_enum=False),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    store: Mapped["Store"] = relationship("Store", back_populates="badge_history")
    admin_user: Mapped[Optional["User"]] = relationship("User")


class Store(TimestampMixin, Base):
    __tablename__ = "stores"
    __table_args__ = (UniqueConstraint("owner_id", name="uq_stores_owner_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    category_slug: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    category_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    telegram: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    instagram: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bale: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    support_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    onboarding_state_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="store")
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    payment_methods: Mapped[list["PaymentMethod"]] = relationship(
        "PaymentMethod",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="store",
        cascade="all, delete-orphan",
    )
    social_links: Mapped[list["StoreSocialLink"]] = relationship(
        "StoreSocialLink",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="StoreSocialLink.sort_order, StoreSocialLink.id",
    )
    trust_badges: Mapped[list["StoreTrustBadge"]] = relationship(
        "StoreTrustBadge",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="StoreTrustBadge.badge_type",
    )
    badge_history: Mapped[list["StoreTrustBadgeHistory"]] = relationship(
        "StoreTrustBadgeHistory",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="StoreTrustBadgeHistory.created_at.desc()",
    )

    @property
    def badge_labels(self) -> list[str]:
        return [badge.badge_type.value for badge in self.trust_badges if badge.is_active]

    @property
    def onboarding_state(self) -> dict[str, Any]:
        if not self.onboarding_state_json:
            return {}

        try:
            value = json.loads(self.onboarding_state_json)
        except json.JSONDecodeError:
            return {}

        return value if isinstance(value, dict) else {}

    def set_onboarding_state(self, value: dict[str, Any]) -> None:
        self.onboarding_state_json = json.dumps(value, ensure_ascii=False)
