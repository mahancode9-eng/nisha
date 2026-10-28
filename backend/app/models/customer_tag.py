from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.store import Store


class CustomerTag(TimestampMixin, Base):
    __tablename__ = "customer_tags"
    __table_args__ = (
        UniqueConstraint("store_id", "name", name="uq_customer_tags_store_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    store: Mapped["Store"] = relationship("Store", back_populates="customer_tags")
    links: Mapped[list["CustomerTagLink"]] = relationship(
        "CustomerTagLink",
        back_populates="tag",
        cascade="all, delete-orphan",
    )


class CustomerTagLink(Base):
    __tablename__ = "customer_tag_links"
    __table_args__ = (
        UniqueConstraint(
            "store_id",
            "customer_key",
            "tag_id",
            name="uq_customer_tag_links_store_key_tag",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_key: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    tag_id: Mapped[int] = mapped_column(
        ForeignKey("customer_tags.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    tag: Mapped["CustomerTag"] = relationship("CustomerTag", back_populates="links")
