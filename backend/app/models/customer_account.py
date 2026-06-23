from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.order import Order
    from app.models.customer_portal import (
        CustomerAddress,
        CustomerOrderReceipt,
        CustomerPasswordRecovery,
        CustomerReview,
        OrderClaim,
        OrderComplaint,
    )


class CustomerAccount(TimestampMixin, Base):
    __tablename__ = "customer_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="customer",
    )
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="customer")
    addresses: Mapped[list["CustomerAddress"]] = relationship(
        "CustomerAddress",
        back_populates="customer",
        cascade="all, delete-orphan",
        order_by="CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc()",
    )
    password_recoveries: Mapped[list["CustomerPasswordRecovery"]] = relationship(
        "CustomerPasswordRecovery",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    order_claims: Mapped[list["OrderClaim"]] = relationship(
        "OrderClaim",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    order_receipts: Mapped[list["CustomerOrderReceipt"]] = relationship(
        "CustomerOrderReceipt",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    complaints: Mapped[list["OrderComplaint"]] = relationship(
        "OrderComplaint",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    reviews: Mapped[list["CustomerReview"]] = relationship(
        "CustomerReview",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
