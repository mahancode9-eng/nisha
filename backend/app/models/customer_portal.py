from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func, text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ComplaintStatus, CustomerReceiptStatus, RecoveryChannel, ReviewStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.customer_account import CustomerAccount
    from app.models.order import Order
    from app.models.store import Store
    from app.models.user import User


class CustomerAddress(TimestampMixin, Base):
    __tablename__ = "customer_addresses"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    postal_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address_line1: Mapped[str] = mapped_column(Text, nullable=False)
    address_line2: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    province: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)

    customer: Mapped["CustomerAccount"] = relationship("CustomerAccount", back_populates="addresses")


class CustomerPasswordRecovery(TimestampMixin, Base):
    __tablename__ = "customer_password_recoveries"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    login_identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[RecoveryChannel] = mapped_column(
        Enum(RecoveryChannel, native_enum=False),
        nullable=False,
    )
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )

    customer: Mapped["CustomerAccount"] = relationship(
        "CustomerAccount",
        back_populates="password_recoveries",
    )


class OrderClaim(TimestampMixin, Base):
    __tablename__ = "order_claims"
    __table_args__ = (UniqueConstraint("order_id", name="uq_order_claims_order_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_code: Mapped[str] = mapped_column(String(50), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="claims")
    customer: Mapped["CustomerAccount"] = relationship(
        "CustomerAccount",
        back_populates="order_claims",
    )


class CustomerOrderReceipt(TimestampMixin, Base):
    __tablename__ = "customer_order_receipts"
    __table_args__ = (UniqueConstraint("order_id", name="uq_customer_order_receipts_order_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[CustomerReceiptStatus] = mapped_column(
        Enum(CustomerReceiptStatus, native_enum=False),
        nullable=False,
    )

    order: Mapped["Order"] = relationship("Order", back_populates="receipt")
    customer: Mapped["CustomerAccount"] = relationship(
        "CustomerAccount",
        back_populates="order_receipts",
    )


class OrderComplaint(TimestampMixin, Base):
    __tablename__ = "order_complaints"
    __table_args__ = (UniqueConstraint("order_id", name="uq_order_complaints_order_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus, native_enum=False),
        server_default=ComplaintStatus.OPEN.value,
        nullable=False,
    )
    seller_notified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    admin_notified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    order: Mapped["Order"] = relationship("Order", back_populates="complaints")
    customer: Mapped["CustomerAccount"] = relationship(
        "CustomerAccount",
        back_populates="complaints",
    )


class CustomerReview(TimestampMixin, Base):
    __tablename__ = "customer_reviews"
    __table_args__ = (UniqueConstraint("order_id", name="uq_customer_reviews_order_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, native_enum=False),
        server_default=ReviewStatus.PRIVATE.value,
        nullable=False,
        index=True,
    )
    moderated_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    moderation_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="reviews")
    customer: Mapped["CustomerAccount"] = relationship(
        "CustomerAccount",
        back_populates="reviews",
    )
    store: Mapped["Store"] = relationship("Store")
    moderated_by_user: Mapped[Optional["User"]] = relationship("User")
    images: Mapped[list["CustomerReviewImage"]] = relationship(
        "CustomerReviewImage",
        back_populates="review",
        cascade="all, delete-orphan",
        order_by="CustomerReviewImage.sort_order",
    )


class CustomerReviewImage(TimestampMixin, Base):
    __tablename__ = "customer_review_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    review_id: Mapped[int] = mapped_column(
        ForeignKey("customer_reviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)

    review: Mapped["CustomerReview"] = relationship("CustomerReview", back_populates="images")
