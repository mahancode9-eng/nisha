from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.customer_account import CustomerAccount
    from app.models.message import Message
    from app.models.order import Order
    from app.models.store import Store


class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("order_id", name="uq_conversations_order_id"),
        Index(
            "uq_conversations_store_customer_no_order",
            "store_id",
            "customer_id",
            unique=True,
            postgresql_where=text("order_id IS NULL"),
            sqlite_where=text("order_id IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True)
    customer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("customer_accounts.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    order_id: Mapped[int | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    store: Mapped["Store"] = relationship("Store", back_populates="conversations")
    customer: Mapped["CustomerAccount"] = relationship(
        "CustomerAccount",
        back_populates="conversations",
    )
    order: Mapped[Optional["Order"]] = relationship("Order", back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        order_by="Message.created_at.asc()",
    )
