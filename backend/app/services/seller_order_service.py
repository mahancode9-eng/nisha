from datetime import date, datetime, time, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.services import order_access_service, stock_service
from app.services.exceptions import ServiceError
from app.utils import order_transitions


def get_order_for_store(db: Session, store: Store, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment_proofs),
            selectinload(Order.payment_method),
            selectinload(Order.status_history),
            selectinload(Order.receipt),
            selectinload(Order.complaints),
            selectinload(Order.customer),
        )
        .where(Order.id == order_id, Order.store_id == store.id)
    )
    if order is None:
        raise ServiceError("سفارش پیدا نشد", status_code=404)
    return order


def list_orders(
    db: Session,
    store: Store,
    *,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> list[Order]:
    query = _orders_filter_query(
        store,
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
    ).order_by(Order.created_at.desc())
    return list(db.scalars(query).all())


def _orders_filter_query(
    store: Store,
    *,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
):
    query = select(Order).where(Order.store_id == store.id)
    if status is not None:
        query = query.where(Order.status == status)
    if date_from is not None:
        start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        query = query.where(Order.created_at >= start)
    if date_to is not None:
        end = datetime.combine(date_to, time.max, tzinfo=timezone.utc)
        query = query.where(Order.created_at <= end)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            or_(Order.invoice_code.ilike(term), Order.buyer_phone.ilike(term))
        )
    return query.options(selectinload(Order.receipt), selectinload(Order.complaints))


def list_orders_paginated(
    db: Session,
    store: Store,
    *,
    page: int,
    page_size: int,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> tuple[list[Order], int]:
    base = _orders_filter_query(
        store,
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    offset = (page - 1) * page_size
    items = list(
        db.scalars(
            base.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
        ).all()
    )
    return items, total


def confirm_payment(db: Session, store: Store, order_id: int, seller: User) -> Order:
    order = get_order_for_store(db, store, order_id)
    order_transitions.validate_confirm(order.status)

    old_status = order.status
    order.status = OrderStatus.PAYMENT_CONFIRMED
    order_access_service.append_status_history(
        db,
        order=order,
        old_status=old_status,
        new_status=OrderStatus.PAYMENT_CONFIRMED,
        changed_by_user=seller,
        note="پرداخت تایید شد",
    )
    db.commit()
    db.refresh(order)
    return order


def reject_payment(db: Session, store: Store, order_id: int, seller: User) -> Order:
    order = get_order_for_store(db, store, order_id)
    order_transitions.validate_reject(order.status)

    stock_service.restore_order_stock(db, order)
    old_status = order.status
    order.status = OrderStatus.PAYMENT_REJECTED
    order_access_service.append_status_history(
        db,
        order=order,
        old_status=old_status,
        new_status=OrderStatus.PAYMENT_REJECTED,
        changed_by_user=seller,
        note="پرداخت رد شد",
    )
    db.commit()
    db.refresh(order)
    return order


def update_order_status(
    db: Session,
    store: Store,
    order_id: int,
    seller: User,
    *,
    target_status: OrderStatus,
    note: str | None = None,
) -> Order:
    order = get_order_for_store(db, store, order_id)
    order_transitions.validate_patch_transition(order.status, target_status)

    if target_status == OrderStatus.CANCELLED:
        stock_service.restore_order_stock(db, order)

    old_status = order.status
    order.status = target_status
    order_access_service.append_status_history(
        db,
        order=order,
        old_status=old_status,
        new_status=target_status,
        changed_by_user=seller,
        note=note,
    )
    db.commit()
    db.refresh(order)
    return order
