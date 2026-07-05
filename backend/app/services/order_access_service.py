from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import verify_password
from app.models.enums import OrderStatus
from app.models.order import Order, OrderStatusHistory
from app.models.user import User
from app.services import order_notification_service
from app.services.exceptions import ServiceError

EDITABLE_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}
UPLOAD_ALLOWED_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}


def get_order_by_invoice_code(db: Session, invoice_code: str) -> Order:
    order = db.scalar(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment_proofs),
            selectinload(Order.payment_method),
            selectinload(Order.store),
            selectinload(Order.status_history),
        )
        .where(Order.invoice_code == invoice_code)
    )
    if order is None:
        raise ServiceError("Order not found", status_code=404)
    return order


def authenticate_order(db: Session, invoice_code: str, password: str) -> Order:
    order = get_order_by_invoice_code(db, invoice_code)
    if not verify_password(password, order.invoice_password_hash):
        raise ServiceError("Invalid invoice credentials", status_code=401)
    return order


def assert_editable_status(order: Order) -> None:
    if order.status not in EDITABLE_STATUSES:
        raise ServiceError(
            "Order cannot be edited after payment is confirmed",
            status_code=422,
        )


def assert_upload_allowed_status(order: Order) -> None:
    if order.status not in UPLOAD_ALLOWED_STATUSES:
        raise ServiceError(
            "Payment proof cannot be uploaded for this order status",
            status_code=422,
        )


def append_status_history(
    db: Session,
    *,
    order: Order,
    old_status: OrderStatus | None,
    new_status: OrderStatus,
    changed_by_user: User | None = None,
    note: str | None = None,
) -> None:
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            old_status=old_status,
            new_status=new_status,
            changed_by_user_id=changed_by_user.id if changed_by_user else None,
            note=note,
        )
    )
    # Roadmap task 12: every recorded status change also enqueues the
    # matching buyer/seller notifications (best-effort, never raises).
    order_notification_service.notify_status_change(db, order, new_status)
