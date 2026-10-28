"""Phase 6b: a seller's own domain for their store (Pro)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class StoreDomain(TimestampMixin, Base):
    __tablename__ = "store_domains"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_id: Mapped[int] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    hostname: Mapped[str] = mapped_column(String(253), nullable=False, unique=True, index=True)
    verification_token: Mapped[str] = mapped_column(String(64), nullable=False)
    # Ownership proven by the TXT record; routing and HTTPS need this.
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    # Whether the domain pointed at Nisha (CNAME/A) at the last check.
    dns_pointing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
