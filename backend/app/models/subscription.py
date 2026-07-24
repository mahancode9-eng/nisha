from __future__ import annotations

import json
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    BillingPeriod,
    SellerSubscriptionStatus,
    SubscriptionInvoiceStatus,
)
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class SubscriptionPlan(TimestampMixin, Base):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name_fa: Mapped[str] = mapped_column(String(100), nullable=False)
    monthly_price_toman: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quarterly_price_toman: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    yearly_price_toman: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_recommended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    entitlements_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")

    subscriptions: Mapped[list["SellerSubscription"]] = relationship(
        "SellerSubscription",
        back_populates="plan",
    )
    invoices: Mapped[list["SubscriptionInvoice"]] = relationship(
        "SubscriptionInvoice",
        back_populates="plan",
    )

    @property
    def entitlements(self) -> dict[str, Any]:
        try:
            value = json.loads(self.entitlements_json or "{}")
        except json.JSONDecodeError:
            return {}
        return value if isinstance(value, dict) else {}

    def set_entitlements(self, value: dict[str, Any]) -> None:
        self.entitlements_json = json.dumps(value, ensure_ascii=False)


class SellerSubscription(TimestampMixin, Base):
    __tablename__ = "seller_subscriptions"
    __table_args__ = (UniqueConstraint("seller_user_id", name="uq_seller_subscriptions_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[SellerSubscriptionStatus] = mapped_column(
        Enum(SellerSubscriptionStatus, native_enum=False),
        nullable=False,
        default=SellerSubscriptionStatus.ACTIVE,
        index=True,
    )
    billing_period: Mapped[BillingPeriod] = mapped_column(
        Enum(BillingPeriod, native_enum=False),
        nullable=False,
        default=BillingPeriod.MONTHLY,
    )
    current_period_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    current_period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    seller: Mapped["User"] = relationship("User")
    plan: Mapped[SubscriptionPlan] = relationship(
        "SubscriptionPlan",
        back_populates="subscriptions",
    )


class SubscriptionInvoice(TimestampMixin, Base):
    __tablename__ = "subscription_invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    seller_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    period: Mapped[BillingPeriod] = mapped_column(
        Enum(BillingPeriod, native_enum=False),
        nullable=False,
    )
    amount_toman: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SubscriptionInvoiceStatus] = mapped_column(
        Enum(SubscriptionInvoiceStatus, native_enum=False),
        nullable=False,
        default=SubscriptionInvoiceStatus.PENDING_PAYMENT,
        index=True,
    )
    period_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    admin_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    seller: Mapped["User"] = relationship("User")
    plan: Mapped[SubscriptionPlan] = relationship(
        "SubscriptionPlan",
        back_populates="invoices",
    )
    proofs: Mapped[list["SubscriptionPaymentProof"]] = relationship(
        "SubscriptionPaymentProof",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="SubscriptionPaymentProof.id",
    )


class SubscriptionPaymentProof(Base):
    __tablename__ = "subscription_payment_proofs"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("subscription_invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    invoice: Mapped[SubscriptionInvoice] = relationship(
        "SubscriptionInvoice",
        back_populates="proofs",
    )
