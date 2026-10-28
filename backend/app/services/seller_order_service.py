from datetime import date, datetime, time, timezone

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.models.store import Store
from app.models.user import User
from app.services import chat_service, order_access_service, stock_service
from app.services.exceptions import ServiceError
from app.utils import order_transitions


def conversation_id_for_order(order: Order) -> int | None:
    if not order.conversations:
        return None
    return order.conversations[0].id


def payment_proof_count_for_order(order: Order) -> int:
    return len(order.payment_proofs) if order.payment_proofs is not None else 0


def get_order_for_store(db: Session, store: Store, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.field_values),
            selectinload(Order.payment_proofs),
            selectinload(Order.payment_method),
            selectinload(Order.status_history),
            selectinload(Order.receipt),
            selectinload(Order.complaints),
            selectinload(Order.customer),
            selectinload(Order.conversations),
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
    statuses: list[OrderStatus] | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> list[Order]:
    query = _orders_filter_query(
        store,
        status=status,
        statuses=statuses,
        date_from=date_from,
        date_to=date_to,
        search=search,
    ).order_by(*_orders_order_by(statuses=statuses, status=status))
    return list(db.scalars(query).all())


def _orders_filter_query(
    store: Store,
    *,
    status: OrderStatus | None = None,
    statuses: list[OrderStatus] | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
):
    query = select(Order).where(Order.store_id == store.id)
    status_list = [s for s in (statuses or []) if s is not None]
    if status_list:
        query = query.where(Order.status.in_(status_list))
    elif status is not None:
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
            or_(
                Order.invoice_code.ilike(term),
                Order.buyer_phone.ilike(term),
                Order.buyer_name.ilike(term),
            )
        )
    return query.options(
        selectinload(Order.receipt),
        selectinload(Order.complaints),
        selectinload(Order.payment_proofs),
        selectinload(Order.conversations),
    )


def _orders_order_by(
    *,
    statuses: list[OrderStatus] | None = None,
    status: OrderStatus | None = None,
):
    """Prefer PAYMENT_UPLOADED when listing the payment/proof inbox stage."""
    status_list = [s for s in (statuses or []) if s is not None]
    if status is not None:
        status_list = [status]
    if OrderStatus.PAYMENT_UPLOADED in status_list and len(status_list) > 1:
        return (
            case((Order.status == OrderStatus.PAYMENT_UPLOADED, 0), else_=1),
            Order.created_at.desc(),
        )
    return (Order.created_at.desc(),)


def list_orders_paginated(
    db: Session,
    store: Store,
    *,
    page: int,
    page_size: int,
    status: OrderStatus | None = None,
    statuses: list[OrderStatus] | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> tuple[list[Order], int]:
    base = _orders_filter_query(
        store,
        status=status,
        statuses=statuses,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    offset = (page - 1) * page_size
    items = list(
        db.scalars(
            base.order_by(*_orders_order_by(statuses=statuses, status=status))
            .offset(offset)
            .limit(page_size)
        ).all()
    )
    return items, total


def open_order_conversation(db: Session, store: Store, order_id: int):
    order = get_order_for_store(db, store, order_id)
    conversation = chat_service.get_or_create_conversation(
        db,
        store_id=store.id,
        order_id=order.id,
        customer_id=order.customer_id,
    )
    db.commit()
    db.refresh(conversation)
    return conversation


def confirm_payment(db: Session, store: Store, order_id: int, seller: User) -> Order:
    order = get_order_for_store(db, store, order_id)
    order_transitions.validate_confirm(order.status)

    old_status = order.status
    order.status = OrderStatus.PAYMENT_CONFIRMED
    order.reservation_expires_at = None
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
    order.reservation_expires_at = None
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
    tracking_code: str | None = None,
) -> Order:
    order = get_order_for_store(db, store, order_id)
    order_transitions.validate_patch_transition(order.status, target_status)

    if target_status == OrderStatus.CANCELLED:
        stock_service.restore_order_stock(db, order)
        order.reservation_expires_at = None

    if tracking_code is not None:
        cleaned = tracking_code.strip()
        if cleaned:
            order.tracking_code = cleaned

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


_TRACKING_ALLOWED_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}


def update_tracking_code(
    db: Session,
    store: Store,
    order_id: int,
    *,
    tracking_code: str,
) -> Order:
    order = get_order_for_store(db, store, order_id)
    if order.status not in _TRACKING_ALLOWED_STATUSES:
        raise ServiceError(
            "کد پیگیری فقط بعد از تایید پرداخت ثبت می‌شه.",
            status_code=422,
        )
    cleaned = tracking_code.strip()
    if not cleaned:
        raise ServiceError("کد پیگیری رو وارد کن.", status_code=422)
    order.tracking_code = cleaned
    db.commit()
    db.refresh(order)
    return order
