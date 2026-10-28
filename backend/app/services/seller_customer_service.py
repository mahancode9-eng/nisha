from __future__ import annotations

from decimal import Decimal
from urllib.parse import unquote

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.order import Order
from app.models.store import Store
from app.schemas.customer_tag import CustomerTagResponse
from app.schemas.seller_customer import (
    SellerCustomerDetail,
    SellerCustomerListItem,
    SellerCustomerOrderItem,
)
from app.services import customer_tag_service
from app.services.exceptions import ServiceError
from app.models.enums import OrderStatus

_SPEND_STATUSES = {
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
}

ACCOUNT_PREFIX = "c:"
GUEST_PREFIX = "g:"


def _account_key(customer_id: int) -> str:
    return f"{ACCOUNT_PREFIX}{customer_id}"


def _guest_key(phone: str) -> str:
    return f"{GUEST_PREFIX}{phone.strip()}"


def parse_customer_key(key: str) -> tuple[str, str]:
    raw = unquote(key).strip()
    if raw.startswith(ACCOUNT_PREFIX):
        return "account", raw[len(ACCOUNT_PREFIX) :]
    if raw.startswith(GUEST_PREFIX):
        return "guest", raw[len(GUEST_PREFIX) :]
    # Allow bare numeric ids for registered accounts.
    if raw.isdigit():
        return "account", raw
    raise ServiceError("Customer not found", status_code=404)


def _conversation_map(db: Session, store_id: int) -> dict[int, int]:
    rows = db.execute(
        select(Conversation.customer_id, Conversation.id).where(
            Conversation.store_id == store_id,
            Conversation.customer_id.is_not(None),
        )
    ).all()
    return {int(customer_id): int(conversation_id) for customer_id, conversation_id in rows if customer_id}


def list_customers_paginated(
    db: Session,
    store: Store,
    *,
    page: int,
    page_size: int,
    search: str | None = None,
    tag_id: int | None = None,
) -> tuple[list[SellerCustomerListItem], int]:
    store_id = store.id
    conversation_by_customer = _conversation_map(db, store_id)

    account_stats = db.execute(
        select(
            Order.customer_id,
            func.count(Order.id),
            func.max(Order.created_at),
            func.max(Order.buyer_name),
            func.max(Order.buyer_phone),
            func.coalesce(
                func.sum(
                    case(
                        (Order.status.in_(_SPEND_STATUSES), Order.total_amount),
                        else_=0,
                    )
                ),
                0,
            ),
        )
        .where(Order.store_id == store_id, Order.customer_id.is_not(None))
        .group_by(Order.customer_id)
    ).all()

    account_ids = {int(row[0]) for row in account_stats if row[0] is not None}
    account_ids.update(conversation_by_customer.keys())

    accounts: dict[int, CustomerAccount] = {}
    if account_ids:
        accounts = {
            account.id: account
            for account in db.scalars(
                select(CustomerAccount).where(CustomerAccount.id.in_(account_ids))
            ).all()
        }

    stats_by_id = {
        int(customer_id): {
            "order_count": int(order_count or 0),
            "last_order_at": last_order_at,
            "buyer_name": buyer_name,
            "buyer_phone": buyer_phone,
            "total_spent": str(total_spent or 0),
        }
        for customer_id, order_count, last_order_at, buyer_name, buyer_phone, total_spent in account_stats
        if customer_id is not None
    }

    items: list[SellerCustomerListItem] = []

    for customer_id in account_ids:
        account = accounts.get(customer_id)
        stats = stats_by_id.get(customer_id, {})
        conversation_id = conversation_by_customer.get(customer_id)
        full_name = (
            (account.full_name if account else None)
            or stats.get("buyer_name")
            or "مشتری"
        )
        phone = (account.phone if account else None) or stats.get("buyer_phone")
        email = account.email if account else None
        order_count = int(stats.get("order_count") or 0)
        items.append(
            SellerCustomerListItem(
                key=_account_key(customer_id),
                kind="account",
                customer_id=customer_id,
                full_name=full_name,
                phone=phone,
                email=email,
                order_count=order_count,
                total_spent=str(stats.get("total_spent") or "0"),
                is_repeat=order_count >= 2,
                last_order_at=stats.get("last_order_at"),
                has_conversation=conversation_id is not None,
                conversation_id=conversation_id,
            )
        )

    guest_rows = db.execute(
        select(
            Order.buyer_phone,
            func.max(Order.buyer_name),
            func.count(Order.id),
            func.max(Order.created_at),
            func.coalesce(
                func.sum(
                    case(
                        (Order.status.in_(_SPEND_STATUSES), Order.total_amount),
                        else_=0,
                    )
                ),
                0,
            ),
        )
        .where(Order.store_id == store_id, Order.customer_id.is_(None))
        .group_by(Order.buyer_phone)
    ).all()

    for phone, buyer_name, order_count, last_order_at, total_spent in guest_rows:
        if not phone:
            continue
        count = int(order_count or 0)
        items.append(
            SellerCustomerListItem(
                key=_guest_key(str(phone)),
                kind="guest",
                customer_id=None,
                full_name=buyer_name or "خریدار مهمان",
                phone=str(phone),
                email=None,
                order_count=count,
                total_spent=str(total_spent or 0),
                is_repeat=count >= 2,
                last_order_at=last_order_at,
                has_conversation=False,
                conversation_id=None,
            )
        )

    if search:
        term = search.strip().lower()
        items = [
            item
            for item in items
            if term in (item.full_name or "").lower()
            or term in (item.phone or "").lower()
            or term in (item.email or "").lower()
        ]

    if tag_id is not None:
        allowed = customer_tag_service.keys_for_tag(db, store_id, tag_id)
        items = [item for item in items if item.key in allowed]

    tags_by_key = customer_tag_service.tags_for_keys(
        db, store_id, [item.key for item in items]
    )
    for item in items:
        item.tags = [
            CustomerTagResponse.model_validate(tag)
            for tag in tags_by_key.get(item.key, [])
        ]

    def sort_key(item: SellerCustomerListItem) -> tuple[float, str]:
        ts = item.last_order_at.timestamp() if item.last_order_at else 0.0
        return (-ts, item.full_name.lower())

    items.sort(key=sort_key)
    total = len(items)
    offset = (page - 1) * page_size
    return items[offset : offset + page_size], total


def get_customer_detail(db: Session, store: Store, key: str) -> SellerCustomerDetail:
    kind, value = parse_customer_key(key)
    store_id = store.id
    conversation_by_customer = _conversation_map(db, store_id)

    if kind == "account":
        try:
            customer_id = int(value)
        except ValueError as exc:
            raise ServiceError("Customer not found", status_code=404) from exc

        account = db.scalar(select(CustomerAccount).where(CustomerAccount.id == customer_id))
        orders = list(
            db.scalars(
                select(Order)
                .where(Order.store_id == store_id, Order.customer_id == customer_id)
                .order_by(Order.created_at.desc())
            ).all()
        )
        has_conversation = customer_id in conversation_by_customer
        if account is None and not orders and not has_conversation:
            raise ServiceError("Customer not found", status_code=404)

        latest = orders[0] if orders else None
        conversation_id = conversation_by_customer.get(customer_id)
        full_name = (
            (account.full_name if account else None)
            or (latest.buyer_name if latest else None)
            or "مشتری"
        )
        phone = (account.phone if account else None) or (latest.buyer_phone if latest else None)
        email = account.email if account else None
        key = _account_key(customer_id)
        spent = sum(
            (Decimal(order.total_amount) for order in orders if order.status in _SPEND_STATUSES),
            Decimal("0"),
        )
        tags = customer_tag_service.tags_for_keys(db, store_id, [key]).get(key, [])
        return SellerCustomerDetail(
            key=key,
            kind="account",
            customer_id=customer_id,
            full_name=full_name,
            phone=phone,
            email=email,
            postal_code=account.postal_code if account else None,
            last_address=latest.buyer_address if latest else None,
            order_count=len(orders),
            total_spent=str(spent or 0),
            is_repeat=len(orders) >= 2,
            last_order_at=latest.created_at if latest else None,
            has_conversation=conversation_id is not None,
            conversation_id=conversation_id,
            tags=[CustomerTagResponse.model_validate(tag) for tag in tags],
            orders=[
                SellerCustomerOrderItem(
                    id=order.id,
                    invoice_code=order.invoice_code,
                    status=order.status,
                    total_amount=str(order.total_amount),
                    buyer_address=order.buyer_address,
                    created_at=order.created_at,
                )
                for order in orders
            ],
        )

    phone = value.strip()
    if not phone:
        raise ServiceError("Customer not found", status_code=404)

    orders = list(
        db.scalars(
            select(Order)
            .where(
                Order.store_id == store_id,
                Order.customer_id.is_(None),
                Order.buyer_phone == phone,
            )
            .order_by(Order.created_at.desc())
        ).all()
    )
    if not orders:
        raise ServiceError("Customer not found", status_code=404)

    latest = orders[0]
    key = _guest_key(phone)
    spent = sum(
        (Decimal(order.total_amount) for order in orders if order.status in _SPEND_STATUSES),
        Decimal("0"),
    )
    tags = customer_tag_service.tags_for_keys(db, store_id, [key]).get(key, [])
    return SellerCustomerDetail(
        key=key,
        kind="guest",
        customer_id=None,
        full_name=latest.buyer_name or "خریدار مهمان",
        phone=phone,
        email=None,
        postal_code=None,
        last_address=latest.buyer_address,
        order_count=len(orders),
        total_spent=str(spent),
        is_repeat=len(orders) >= 2,
        last_order_at=latest.created_at,
        has_conversation=False,
        conversation_id=None,
        tags=[CustomerTagResponse.model_validate(tag) for tag in tags],
        orders=[
            SellerCustomerOrderItem(
                id=order.id,
                invoice_code=order.invoice_code,
                status=order.status,
                total_amount=str(order.total_amount),
                buyer_address=order.buyer_address,
                created_at=order.created_at,
            )
            for order in orders
        ],
    )
