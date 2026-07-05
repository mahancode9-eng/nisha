from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OrderStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.customer_account import CustomerAccount
    from app.models.customer_portal import (
        CustomerOrderReceipt,
        CustomerReview,
        OrderClaim,
        OrderComplaint,
    )
    from app.models.payment_method import PaymentMethod
    from app.models.product import Product
    from app.models.store import Store
    from app.models.user import User
    from app.models.product import OrderItemFieldValue


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    invoice_password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    buyer_address: Mapped[str] = mapped_column(Text, nullable=False)
    buyer_note: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    payment_method_id: Mapped[int] = mapped_column(
        ForeignKey("payment_methods.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False),
        server_default=OrderStatus.PENDING_PAYMENT.value,
        nullable=False,
        index=True,
    )
    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_restored: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    store: Mapped["Store"] = relationship("Store", back_populates="orders")
    customer: Mapped[Optional["CustomerAccount"]] = relationship(
        "CustomerAccount",
        back_populates="orders",
    )
    payment_method: Mapped["PaymentMethod"] = relationship(
        "PaymentMethod",
        back_populates="orders",
    )
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    payment_proofs: Mapped[list["PaymentProof"]] = relationship(
        "PaymentProof",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at",
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="order",
    )
    claims: Mapped[list["OrderClaim"]] = relationship(
        "OrderClaim",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    receipt: Mapped[Optional["CustomerOrderReceipt"]] = relationship(
        "CustomerOrderReceipt",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )
    complaints: Mapped[list["OrderComplaint"]] = relationship(
        "OrderComplaint",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    reviews: Mapped[list["CustomerReview"]] = relationship(
        "CustomerReview",
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_title_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="order_items")
    field_values: Mapped[list["OrderItemFieldValue"]] = relationship(
        "OrderItemFieldValue",
        cascade="all, delete-orphan",
        order_by="OrderItemFieldValue.sort_order",
    )


class PaymentProof(Base):
    __tablename__ = "payment_proofs"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    order: Mapped["Order"] = relationship("Order", back_populates="payment_proofs")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_status: Mapped[Optional[OrderStatus]] = mapped_column(
        Enum(OrderStatus, native_enum=False),
        nullable=True,
    )
    new_status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False),
        nullable=False,
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    order: Mapped["Order"] = relationship("Order", back_populates="status_history")
    changed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="status_changes",
    )
