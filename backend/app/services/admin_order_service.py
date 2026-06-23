from __future__ import annotations

from datetime import date, datetime, time, timezone
import json

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.customer_portal import CustomerOrderReceipt, OrderComplaint
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.models.product import OrderItemFieldValue
from app.models.store import Store
from app.schemas.admin import (
    AdminAuditLogResponse,
    AdminOrderDetailResponse,
    AdminOrderFieldValueResponse,
    AdminOrderItemSubmissionResponse,
    AdminOrderListItem,
    AdminOrderUpdateRequest,
)
from app.schemas.chat import ConversationDetailResponse
from app.schemas.customer_portal import CustomerComplaintResponse, CustomerProfileResponse
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse
from app.schemas.seller_order import SellerOrderItemResponse
from app.services.admin_audit_service import list_entity_logs, record_admin_action
from app.services.chat_service import get_admin_conversation_detail
from app.services.exceptions import ServiceError
from app.services.order_access_service import append_status_history
from app.services.stock_service import restore_order_stock
from app.utils import order_transitions


def _parse_json(value):
    if value is None or value == "":
        return None
    if isinstance(value, (dict, list, int, float, bool)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return value


def _admin_orders_query(
    *,
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> tuple[select, select]:
    complaint_counts = (
        select(OrderComplaint.order_id, func.count(OrderComplaint.id).label("complaint_count"))
        .group_by(OrderComplaint.order_id)
        .subquery()
    )
    receipt_status = (
        select(
            CustomerOrderReceipt.order_id,
            CustomerOrderReceipt.status.label("receipt_status"),
        )
        .subquery()
    )
    base = (
        select(
            Order,
            Store.name.label("store_name"),
            Store.slug.label("store_slug"),
            CustomerAccount.full_name.label("customer_name"),
            CustomerAccount.email.label("customer_email"),
            func.coalesce(complaint_counts.c.complaint_count, 0).label("complaint_count"),
            receipt_status.c.receipt_status.label("receipt_status"),
        )
        .join(Store, Order.store_id == Store.id)
        .outerjoin(CustomerAccount, Order.customer_id == CustomerAccount.id)
        .outerjoin(complaint_counts, Order.id == complaint_counts.c.order_id)
        .outerjoin(receipt_status, Order.id == receipt_status.c.order_id)
    )
    count_query = (
        select(func.count())
        .select_from(Order)
        .join(Store, Order.store_id == Store.id)
        .outerjoin(CustomerAccount, Order.customer_id == CustomerAccount.id)
        .outerjoin(complaint_counts, Order.id == complaint_counts.c.order_id)
        .outerjoin(receipt_status, Order.id == receipt_status.c.order_id)
    )
    if store_id is not None:
        base = base.where(Order.store_id == store_id)
        count_query = count_query.where(Order.store_id == store_id)
    if status is not None:
        base = base.where(Order.status == status)
        count_query = count_query.where(Order.status == status)
    if date_from is not None:
        start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        base = base.where(Order.created_at >= start)
        count_query = count_query.where(Order.created_at >= start)
    if date_to is not None:
        end = datetime.combine(date_to, time.max, tzinfo=timezone.utc)
        base = base.where(Order.created_at <= end)
        count_query = count_query.where(Order.created_at <= end)
    if search:
        term = f"%{search.strip()}%"
        search_filter = or_(
            Order.invoice_code.ilike(term),
            Order.buyer_name.ilike(term),
            Order.buyer_phone.ilike(term),
            Order.buyer_address.ilike(term),
            Store.name.ilike(term),
            CustomerAccount.full_name.ilike(term),
            CustomerAccount.email.ilike(term),
            CustomerAccount.phone.ilike(term),
        )
        base = base.where(search_filter)
        count_query = count_query.where(search_filter)
    return base.order_by(Order.created_at.desc()), count_query


def _rows_to_admin_order_items(rows) -> list[AdminOrderListItem]:
    return [
        AdminOrderListItem(
            id=row.Order.id,
            invoice_code=row.Order.invoice_code,
            status=row.Order.status,
            buyer_name=row.Order.buyer_name,
            buyer_phone=row.Order.buyer_phone,
            total_amount=row.Order.total_amount,
            store_id=row.Order.store_id,
            store_name=row.store_name,
            store_slug=row.store_slug,
            customer_id=row.Order.customer_id,
            receipt_status=row.receipt_status,
            complaint_count=int(row.complaint_count or 0),
            created_at=row.Order.created_at,
        )
        for row in rows
    ]


def list_orders(
    db: Session,
    *,
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> list[AdminOrderListItem]:
    query, _ = _admin_orders_query(
        store_id=store_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    rows = db.execute(query).all()
    return _rows_to_admin_order_items(rows)


def list_orders_paginated(
    db: Session,
    *,
    page: int,
    page_size: int,
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> tuple[list[AdminOrderListItem], int]:
    query, count_query = _admin_orders_query(
        store_id=store_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    total = db.scalar(count_query) or 0
    offset = (page - 1) * page_size
    rows = db.execute(query.offset(offset).limit(page_size)).all()
    return _rows_to_admin_order_items(rows), total


def _load_order(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.field_values),
            selectinload(Order.payment_proofs),
            selectinload(Order.payment_method),
            selectinload(Order.status_history),
            selectinload(Order.store),
            selectinload(Order.receipt),
            selectinload(Order.complaints),
            selectinload(Order.customer),
            selectinload(Order.conversations).selectinload(Conversation.messages),
            selectinload(Order.conversations).selectinload(Conversation.store),
        )
        .where(Order.id == order_id)
    )
    if order is None or order.store is None:
        raise ServiceError("Order not found", status_code=404)
    return order


def get_order_by_id(db: Session, order_id: int) -> tuple[Order, Store]:
    order = _load_order(db, order_id)
    return order, order.store


def _field_value_response(field_value: OrderItemFieldValue) -> AdminOrderFieldValueResponse:
    return AdminOrderFieldValueResponse(
        field_key=field_value.field_key,
        field_label=field_value.field_label,
        field_type=field_value.field_type,
        sort_order=field_value.sort_order,
        value_text=field_value.value_text,
        value_json=_parse_json(field_value.value_json),
        file_url=field_value.file_url,
        field_snapshot=_parse_json(field_value.field_snapshot_json),
    )


def _item_submission_response(item: OrderItem) -> AdminOrderItemSubmissionResponse:
    return AdminOrderItemSubmissionResponse(
        item_id=item.id,
        product_id=item.product_id,
        product_title_snapshot=item.product_title_snapshot,
        field_values=[_field_value_response(field_value) for field_value in item.field_values],
    )


def _conversation_detail(db: Session, order: Order) -> ConversationDetailResponse | None:
    conversation = order.conversations[0] if order.conversations else None
    if conversation is None:
        return None
    return get_admin_conversation_detail(db, conversation.id)


def build_admin_order_detail_response(db: Session, order: Order, store: Store) -> AdminOrderDetailResponse:
    conversation = order.conversations[0] if order.conversations else None
    audit_logs = list_entity_logs(db, entity_type="order", entity_id=order.id)
    return AdminOrderDetailResponse(
        id=order.id,
        invoice_code=order.invoice_code,
        status=order.status,
        buyer_name=order.buyer_name,
        buyer_phone=order.buyer_phone,
        buyer_address=order.buyer_address,
        buyer_note=order.buyer_note,
        subtotal_amount=order.subtotal_amount,
        total_amount=order.total_amount,
        customer_id=order.customer_id,
        customer=CustomerProfileResponse.model_validate(order.customer) if order.customer else None,
        invoice_username=order.invoice_code,
        invoice_password=order.invoice_code,
        receipt_status=order.receipt.status if order.receipt else None,
        complaint_count=len(order.complaints),
        stock_restored=order.stock_restored,
        store_id=store.id,
        store_name=store.name,
        store_slug=store.slug,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[SellerOrderItemResponse.model_validate(item) for item in order.items],
        submissions=[_item_submission_response(item) for item in order.items],
        complaints=[CustomerComplaintResponse.model_validate(complaint) for complaint in order.complaints],
        conversation_id=conversation.id if conversation is not None else None,
        conversation=_conversation_detail(db, order),
        audit_logs=audit_logs,
        payment_method=PaymentMethodResponse.model_validate(order.payment_method),
        payment_proofs=[PaymentProofResponse.model_validate(p) for p in order.payment_proofs],
        status_history=[OrderStatusHistoryResponse.model_validate(h) for h in order.status_history],
    )


def get_order_detail_response(db: Session, order_id: int) -> AdminOrderDetailResponse:
    order, store = get_order_by_id(db, order_id)
    return build_admin_order_detail_response(db, order, store)


def get_order_chat_detail(db: Session, order_id: int) -> ConversationDetailResponse | None:
    order = _load_order(db, order_id)
    return _conversation_detail(db, order)


def update_order(
    db: Session,
    order_id: int,
    payload: AdminOrderUpdateRequest,
    *,
    admin,
) -> AdminOrderDetailResponse:
    order = _load_order(db, order_id)
    changes: dict[str, object] = {}

    if payload.buyer_name is not None and payload.buyer_name != order.buyer_name:
        changes["buyer_name"] = {"from": order.buyer_name, "to": payload.buyer_name}
        order.buyer_name = payload.buyer_name
    if payload.buyer_phone is not None and payload.buyer_phone != order.buyer_phone:
        changes["buyer_phone"] = {"from": order.buyer_phone, "to": payload.buyer_phone}
        order.buyer_phone = payload.buyer_phone
    if payload.buyer_address is not None and payload.buyer_address != order.buyer_address:
        changes["buyer_address"] = {"from": order.buyer_address, "to": payload.buyer_address}
        order.buyer_address = payload.buyer_address
    if payload.buyer_note is not None and payload.buyer_note != order.buyer_note:
        changes["buyer_note"] = {"from": order.buyer_note, "to": payload.buyer_note}
        order.buyer_note = payload.buyer_note

    if payload.status is not None and payload.status != order.status:
        old_status = order.status
        if payload.status == OrderStatus.CANCELLED and not order.stock_restored:
            restore_order_stock(db, order)
        order.status = payload.status
        append_status_history(
            db,
            order=order,
            old_status=old_status,
            new_status=payload.status,
            changed_by_user=admin,
            note=payload.note,
        )
        changes["status"] = {"from": old_status.value, "to": payload.status.value}

    if not changes and payload.note is None:
        raise ServiceError("No changes provided", status_code=422)

    record_admin_action(
        db,
        admin=admin,
        entity_type="order",
        entity_id=order.id,
        action="UPDATE",
        entity_label=order.invoice_code,
        note=payload.note,
        details=changes if changes else {"note": payload.note},
    )
    db.commit()
    db.refresh(order)
    order = _load_order(db, order.id)
    return build_admin_order_detail_response(db, order, order.store)
