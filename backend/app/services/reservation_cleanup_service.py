"""Expire unpaid inventory reservations and restore stock."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus
from app.models.order import Order, OrderStatusHistory
from app.services import stock_service

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def expire_stale_reservations(db: Session, *, limit: int = 100) -> int:
    """Cancel expired PENDING_PAYMENT orders and restore stock.

    Idempotent: uses stock_restored and status checks under row locks.
    """
    now = _utcnow()
    candidates = list(
        db.scalars(
            select(Order)
            .options(selectinload(Order.items))
            .where(
                Order.status == OrderStatus.PENDING_PAYMENT,
                Order.reservation_expires_at.is_not(None),
                Order.stock_restored.is_(False),
            )
            .limit(limit * 4)
        ).all()
    )
    expired = []
    for order in candidates:
        expires = order.reservation_expires_at
        if expires is None:
            continue
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires <= now:
            expired.append(order)
        if len(expired) >= limit:
            break

    expired_count = 0
    for order in expired:
        # Re-lock / re-check under the same session for race safety.
        locked = db.scalar(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order.id)
            .with_for_update()
        )
        if locked is None or locked.stock_restored or locked.status != OrderStatus.PENDING_PAYMENT:
            continue
        locked_expires = locked.reservation_expires_at
        if locked_expires is None:
            continue
        if locked_expires.tzinfo is None:
            locked_expires = locked_expires.replace(tzinfo=timezone.utc)
        if locked_expires > now:
            continue

        old_status = locked.status
        stock_service.restore_order_stock(db, locked)
        locked.status = OrderStatus.EXPIRED
        locked.reservation_expires_at = None
        db.add(
            OrderStatusHistory(
                order_id=locked.id,
                old_status=old_status,
                new_status=OrderStatus.EXPIRED,
                note="Inventory reservation expired",
                changed_by_user_id=None,
            )
        )
        expired_count += 1

    if expired_count:
        db.commit()
        logger.info("Expired %s unpaid order reservation(s)", expired_count)
    return expired_count


async def reservation_cleanup_worker_loop(stop_event: asyncio.Event, interval_seconds: int) -> None:
    from app.db.session import SessionLocal

    while not stop_event.is_set():
        try:
            with SessionLocal() as db:
                expire_stale_reservations(db)
        except Exception:  # noqa: BLE001 - keep worker alive
            logger.exception("Reservation cleanup failed")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
        except asyncio.TimeoutError:
            continue
