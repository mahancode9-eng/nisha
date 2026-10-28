from __future__ import annotations

from urllib.parse import unquote

from decimal import Decimal

from sqlalchemy import case, delete, func, select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.order import Order
from app.models.store import Store, StoreCustomerTag
from app.schemas.seller_customer import (
    SellerCustomerDetail,
    SellerCustomerListItem,
    SellerCustomerOrderItem,
)
from app.services import entitlement_service
from app.services.exceptions import ServiceError
from app.services.sales_report_service import PAID_STATUSES

MAX_TAGS = 10
MAX_TAG_LENGTH = 30

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


_paid = Order.status.in_(PAID_STATUSES)
_paid_count = func.coalesce(func.sum(case((_paid, 1), else_=0)), 0)
_paid_total = func.coalesce(func.sum(case((_paid, Order.total_amount), else_=0)), 0)


def _tags_by_key(db: Session, store_id: int) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for key, tag in db.execute(
        select(StoreCustomerTag.customer_key, StoreCustomerTag.tag)
        .where(StoreCustomerTag.store_id == store_id)
        .order_by(StoreCustomerTag.id)
    ).all():
        out.setdefault(key, []).append(tag)
    return out


def _all_customers(db: Session, store: Store) -> list[SellerCustomerListItem]:
    """Every buyer of [store] (accounts and guests by phone), newest order first."""
    store_id = store.id
    tags_by_key = _tags_by_key(db, store_id)
    conversation_by_customer = _conversation_map(db, store_id)

    account_stats = db.execute(
        select(
            Order.customer_id,
            func.count(Order.id),
            func.max(Order.created_at),
            func.max(Order.buyer_name),
            func.max(Order.buyer_phone),
            _paid_count,
            _paid_total,
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
            "paid_count": int(paid_count or 0),
            "paid_total": Decimal(str(paid_total or 0)),
        }
        for customer_id, order_count, last_order_at, buyer_name, buyer_phone, paid_count, paid_total in account_stats
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
        key = _account_key(customer_id)
        paid_count = int(stats.get("paid_count") or 0)
        items.append(
            SellerCustomerListItem(
                key=key,
                kind="account",
                customer_id=customer_id,
                full_name=full_name,
                phone=phone,
                email=email,
                order_count=int(stats.get("order_count") or 0),
                last_order_at=stats.get("last_order_at"),
                has_conversation=conversation_id is not None,
                conversation_id=conversation_id,
                paid_order_count=paid_count,
                total_spent=stats.get("paid_total") or Decimal("0"),
                is_repeat=paid_count >= 2,
                tags=tags_by_key.get(key, []),
            )
        )

    guest_rows = db.execute(
        select(
            Order.buyer_phone,
            func.max(Order.buyer_name),
            func.count(Order.id),
            func.max(Order.created_at),
            _paid_count,
            _paid_total,
        )
        .where(Order.store_id == store_id, Order.customer_id.is_(None))
        .group_by(Order.buyer_phone)
    ).all()

    for phone, buyer_name, order_count, last_order_at, paid_count, paid_total in guest_rows:
        if not phone:
            continue
        key = _guest_key(str(phone))
        items.append(
            SellerCustomerListItem(
                key=key,
                kind="guest",
                customer_id=None,
                full_name=buyer_name or "خریدار مهمان",
                phone=str(phone),
                email=None,
                order_count=int(order_count or 0),
                last_order_at=last_order_at,
                has_conversation=False,
                conversation_id=None,
                paid_order_count=int(paid_count or 0),
                total_spent=Decimal(str(paid_total or 0)),
                is_repeat=int(paid_count or 0) >= 2,
                tags=tags_by_key.get(key, []),
            )
        )

    def sort_key(item: SellerCustomerListItem) -> tuple[float, str]:
        ts = item.last_order_at.timestamp() if item.last_order_at else 0.0
        return (-ts, item.full_name.lower())

    items.sort(key=sort_key)
    return items


def list_customers_paginated(
    db: Session,
    store: Store,
    *,
    page: int,
    page_size: int,
    search: str | None = None,
    tag: str | None = None,
    repeat_only: bool = False,
) -> tuple[list[SellerCustomerListItem], int]:
    entitlement_service.require_entitlement(
        db,
        store.owner_id,
        "customer_list",
        message="لیست مشتری‌ها تو پلن فعلی‌ت فعال نیست. با پلن پایه بازش کن.",
    )
    items = _all_customers(db, store)
    if repeat_only:
        items = [item for item in items if item.is_repeat]
    if tag:
        wanted = tag.strip()
        items = [item for item in items if wanted in item.tags]
    if search:
        term = search.strip().lower()
        items = [
            item
            for item in items
            if term in (item.full_name or "").lower()
            or term in (item.phone or "").lower()
            or term in (item.email or "").lower()
        ]

    total = len(items)
    offset = (page - 1) * page_size
    return items[offset : offset + page_size], total


def _order_stats(orders: list[Order], tags: list[str]) -> dict:
    paid = [o for o in orders if o.status in PAID_STATUSES]
    return {
        "paid_order_count": len(paid),
        "total_spent": sum((Decimal(str(o.total_amount)) for o in paid), Decimal("0")),
        "is_repeat": len(paid) >= 2,
        "tags": tags,
    }


def get_customer_detail(db: Session, store: Store, key: str) -> SellerCustomerDetail:
    kind, value = parse_customer_key(key)
    store_id = store.id
    conversation_by_customer = _conversation_map(db, store_id)
    tags_by_key = _tags_by_key(db, store_id)
    key = _account_key(int(value)) if kind == "account" and value.isdigit() else _guest_key(value)

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
        return SellerCustomerDetail(
            key=_account_key(customer_id),
            kind="account",
            customer_id=customer_id,
            full_name=full_name,
            phone=phone,
            email=email,
            postal_code=account.postal_code if account else None,
            last_address=latest.buyer_address if latest else None,
            order_count=len(orders),
            last_order_at=latest.created_at if latest else None,
            has_conversation=conversation_id is not None,
            conversation_id=conversation_id,
            **_order_stats(orders, tags_by_key.get(key, [])),
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
    return SellerCustomerDetail(
        key=_guest_key(phone),
        kind="guest",
        customer_id=None,
        full_name=latest.buyer_name or "خریدار مهمان",
        phone=phone,
        email=None,
        postal_code=None,
        last_address=latest.buyer_address,
        order_count=len(orders),
        last_order_at=latest.created_at,
        has_conversation=False,
        conversation_id=None,
        **_order_stats(orders, tags_by_key.get(key, [])),
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


def _normalize_tags(tags: list[str]) -> list[str]:
    out: list[str] = []
    for raw in tags:
        tag = " ".join(str(raw).split())[:MAX_TAG_LENGTH]
        if tag and tag not in out:
            out.append(tag)
    if len(out) > MAX_TAGS:
        raise ServiceError(f"هر مشتری حداکثر {MAX_TAGS} برچسب می‌تونه داشته باشه.", status_code=422)
    return out


def set_customer_tags(db: Session, store: Store, key: str, tags: list[str]) -> tuple[str, list[str]]:
    """Replace a buyer's tags (Pro). Returns the canonical key and the saved tags."""
    entitlement_service.require_entitlement(
        db,
        store.owner_id,
        "customer_tags",
        message="برچسب مشتری مخصوص پلن حرفه‌ایه.",
    )
    kind, value = parse_customer_key(key)
    if kind == "account":
        if not value.isdigit():
            raise ServiceError("Customer not found", status_code=404)
        canonical = _account_key(int(value))
        known = db.scalar(
            select(func.count(Order.id)).where(Order.store_id == store.id, Order.customer_id == int(value))
        ) or (int(value) in _conversation_map(db, store.id))
    else:
        phone = value.strip()
        canonical = _guest_key(phone)
        known = db.scalar(
            select(func.count(Order.id)).where(
                Order.store_id == store.id,
                Order.customer_id.is_(None),
                Order.buyer_phone == phone,
            )
        )
    if not known:
        raise ServiceError("Customer not found", status_code=404)

    clean = _normalize_tags(tags)
    db.execute(
        delete(StoreCustomerTag).where(
            StoreCustomerTag.store_id == store.id,
            StoreCustomerTag.customer_key == canonical,
        )
    )
    for tag in clean:
        db.add(StoreCustomerTag(store_id=store.id, customer_key=canonical, tag=tag))
    db.commit()
    return canonical, clean


def list_tags(db: Session, store: Store) -> list[str]:
    """Every tag the seller has used, most used first (Pro)."""
    entitlement_service.require_entitlement(
        db, store.owner_id, "customer_tags", message="برچسب مشتری مخصوص پلن حرفه‌ایه."
    )
    return list(
        db.scalars(
            select(StoreCustomerTag.tag)
            .where(StoreCustomerTag.store_id == store.id)
            .group_by(StoreCustomerTag.tag)
            .order_by(func.count(StoreCustomerTag.id).desc(), StoreCustomerTag.tag)
        ).all()
    )


def all_customers_for_export(db: Session, store: Store) -> list[SellerCustomerListItem]:
    entitlement_service.require_entitlement(
        db,
        store.owner_id,
        "customer_export",
        message="خروجی اکسل مشتری‌ها مخصوص پلن حرفه‌ایه.",
    )
    return _all_customers(db, store)
