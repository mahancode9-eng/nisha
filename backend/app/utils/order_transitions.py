from app.models.enums import OrderStatus
from app.services.exceptions import ServiceError

CONFIRM_SOURCES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}
REJECT_SOURCES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_UPLOADED}

PATCH_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PREPARING: {OrderStatus.PAYMENT_CONFIRMED},
    OrderStatus.SHIPPED: {OrderStatus.PREPARING},
    OrderStatus.DELIVERED: {OrderStatus.SHIPPED},
    OrderStatus.CANCELLED: {
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAYMENT_UPLOADED,
        OrderStatus.PAYMENT_CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.SHIPPED,
    },
}

TERMINAL_STATUSES = {
    OrderStatus.DELIVERED,
    OrderStatus.PAYMENT_REJECTED,
    OrderStatus.CANCELLED,
}


def validate_confirm(current: OrderStatus) -> None:
    if current not in CONFIRM_SOURCES:
        raise ServiceError(
            f"Cannot confirm payment from status {current.value}",
            status_code=422,
        )


def validate_reject(current: OrderStatus) -> None:
    if current not in REJECT_SOURCES:
        raise ServiceError(
            f"Cannot reject payment from status {current.value}",
            status_code=422,
        )


def validate_patch_transition(current: OrderStatus, target: OrderStatus) -> None:
    if current in TERMINAL_STATUSES:
        raise ServiceError(
            f"Cannot change status from terminal state {current.value}",
            status_code=422,
        )
    allowed_sources = PATCH_TRANSITIONS.get(target)
    if allowed_sources is None or current not in allowed_sources:
        raise ServiceError(
            f"Invalid status transition from {current.value} to {target.value}",
            status_code=422,
        )
