from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.store import Store

DISCOUNT_TYPE_PERCENT = "PERCENT"
DISCOUNT_TYPE_FIXED = "FIXED"


class DiscountCode(TimestampMixin, Base):
    """A seller-defined discount code (roadmap task 17).

    Supports percentage or fixed-amount discounts with optional usage cap,
    validity window and minimum order amount.
    """

    __tablename__ = "discount_codes"
    __table_args__ = (
        UniqueConstraint("store_id", "code", name="uq_discount_codes_store_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False)
    percent_off: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    amount_off: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    min_order_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    max_uses: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )
    starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    store: Mapped["Store"] = relationship("Store")
