from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class ShortLink(TimestampMixin, Base):
    __tablename__ = "short_links"
    __table_args__ = (UniqueConstraint("code", name="uq_short_links_code"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    target_path: Mapped[str] = mapped_column(String(500), nullable=False)
    store_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    product_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    hit_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
