from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import StoreBadgeType
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.order import Order
    from app.models.customer_tag import CustomerTag
    from app.models.payment_method import PaymentMethod
    from app.models.product import Product
    from app.models.product_category import ProductCategory
    from app.models.shipping_method import ShippingMethod
    from app.models.store_member import StoreMember
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
    telegram_chat_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    bale_chat_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    telegram_linked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    bale_linked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    support_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    onboarding_state_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dm_reply_templates_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instagram_import_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    guest_checkout_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    theme_preset: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    primary_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    design_style: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    about_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shipping_policy_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_shipping_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0"),
        server_default="0",
        nullable=False,
    )
    free_shipping_min_subtotal: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    payment_reminder_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sms_quota_month: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    sms_sent_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Panel alerts: email (owner) + optional SMS number; Telegram/Bale via chat_id link.
    notify_sms_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notify_by_email: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    notify_by_sms: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    custom_domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    custom_domain_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

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
    shipping_methods: Mapped[list["ShippingMethod"]] = relationship(
        "ShippingMethod",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="ShippingMethod.sort_order, ShippingMethod.id",
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
    product_categories: Mapped[list["ProductCategory"]] = relationship(
        "ProductCategory",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="ProductCategory.sort_order, ProductCategory.id",
    )
    customer_tags: Mapped[list["CustomerTag"]] = relationship(
        "CustomerTag",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="CustomerTag.name",
    )
    members: Mapped[list["StoreMember"]] = relationship(
        "StoreMember",
        back_populates="store",
        cascade="all, delete-orphan",
        order_by="StoreMember.id",
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
