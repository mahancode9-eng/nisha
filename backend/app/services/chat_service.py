from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.conversation import Conversation
from app.models.customer_account import CustomerAccount
from app.models.enums import SenderType
from app.models.message import Message
from app.models.order import Order
from app.models.store import Store
from app.models.user import User
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationListItem,
    ConversationListResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.exceptions import ServiceError


def _message_to_response(message: Message) -> MessageResponse:
    return MessageResponse.model_validate(message)


def _customer_name(db: Session, conversation: Conversation) -> str:
    if conversation.customer is not None:
        return conversation.customer.full_name
    if conversation.order is not None and conversation.order.customer is not None:
        return conversation.order.customer.full_name
    return "Guest"


def _order_invoice_code(conversation: Conversation) -> str | None:
    if conversation.order is None:
        return None
    return conversation.order.invoice_code


def _order_status(conversation: Conversation):
    if conversation.order is None:
        return None
    return conversation.order.status


def _conversation_query():
    return (
        select(Conversation)
        .options(
            joinedload(Conversation.store),
            joinedload(Conversation.customer),
            joinedload(Conversation.order).joinedload(Order.customer),
            selectinload(Conversation.messages),
        )
    )


def _load_conversation(db: Session, conversation_id: int) -> Conversation:
    conversation = db.scalar(_conversation_query().where(Conversation.id == conversation_id))
    if conversation is None:
        raise ServiceError("Conversation not found", status_code=404)
    return conversation


def _conversation_list_item(
    conversation: Conversation,
    *,
    unread_count: int,
) -> ConversationListItem:
    store = conversation.store
    if store is None:
        raise ServiceError("Conversation not found", status_code=404)

    last_message = conversation.messages[-1] if conversation.messages else None
    return ConversationListItem(
        id=conversation.id,
        store_id=conversation.store_id,
        store_name=store.name,
        store_slug=store.slug,
        customer_id=conversation.customer_id,
        customer_name=_customer_name_from_conversation(conversation),
        order_id=conversation.order_id,
        invoice_code=_order_invoice_code(conversation),
        order_status=_order_status(conversation),
        unread_count=unread_count,
        last_message_body=last_message.body if last_message else None,
        last_message_at=last_message.created_at if last_message else None,
        updated_at=conversation.updated_at,
    )


def _customer_name_from_conversation(conversation: Conversation) -> str:
    if conversation.customer is not None:
        return conversation.customer.full_name
    if conversation.order is not None and conversation.order.customer is not None:
        return conversation.order.customer.full_name
    return "Guest"


def _unread_count(
    db: Session,
    conversation_id: int,
    *,
    for_sender_type: SenderType,
) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_type == for_sender_type,
                Message.is_read.is_(False),
            )
        )
        or 0
    )


def _mark_messages_read(
    db: Session,
    conversation_id: int,
    *,
    reader_is_customer: bool,
) -> None:
    sender_to_mark = SenderType.SELLER if reader_is_customer else SenderType.CUSTOMER
    db.execute(
        update(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.sender_type == sender_to_mark,
            Message.is_read.is_(False),
        )
        .values(is_read=True)
        .execution_options(synchronize_session=False)
    )


def _set_order_customer_if_needed(db: Session, conversation: Conversation, customer_id: int | None) -> None:
    if customer_id is not None and conversation.customer_id is None:
        conversation.customer_id = customer_id
        db.flush()


def _get_order(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.store))
        .where(Order.id == order_id)
    )
    if order is None:
        raise ServiceError("Order not found", status_code=404)
    return order


def _get_conversation_for_order(db: Session, order_id: int) -> Conversation | None:
    return db.scalar(
        _conversation_query().where(Conversation.order_id == order_id)
    )


def get_or_create_conversation(
    db: Session,
    *,
    customer_id: int | None = None,
    store_id: int | None = None,
    order_id: int | None = None,
) -> Conversation:
    if order_id is not None:
        order = _get_order(db, order_id)
        if store_id is not None and order.store_id != store_id:
            raise ServiceError("Order not found", status_code=404)
        if customer_id is not None and order.customer_id is not None and order.customer_id != customer_id:
            raise ServiceError("Order not found", status_code=404)

        conversation = _get_conversation_for_order(db, order.id)
        if conversation is None:
            conversation = Conversation(
                store_id=order.store_id,
                order_id=order.id,
                customer_id=order.customer_id or customer_id,
            )
            db.add(conversation)
            try:
                db.commit()
            except IntegrityError:
                # Another request created this conversation concurrently; reuse it.
                db.rollback()
                conversation = _get_conversation_for_order(db, order.id)
                if conversation is None:
                    raise ServiceError("Could not create conversation", status_code=409)
            db.refresh(conversation)
        else:
            _set_order_customer_if_needed(db, conversation, order.customer_id or customer_id)
            db.commit()
            db.refresh(conversation)
        return _load_conversation(db, conversation.id)

    if store_id is None or customer_id is None:
        raise ServiceError("store_id and customer_id are required", status_code=422)

    store = db.get(Store, store_id)
    if store is None or not store.is_active:
        raise ServiceError("Store not found", status_code=404)

    conversation = db.scalar(
        _conversation_query().where(
            Conversation.store_id == store_id,
            Conversation.customer_id == customer_id,
            Conversation.order_id.is_(None),
        )
    )
    if conversation is None:
        conversation = Conversation(store_id=store_id, customer_id=customer_id)
        db.add(conversation)
        try:
            db.commit()
        except IntegrityError:
            # Another request created this conversation concurrently; reuse it.
            db.rollback()
            conversation = db.scalar(
                _conversation_query().where(
                    Conversation.store_id == store_id,
                    Conversation.customer_id == customer_id,
                    Conversation.order_id.is_(None),
                )
            )
            if conversation is None:
                raise ServiceError("Could not create conversation", status_code=409)
        db.refresh(conversation)
    return _load_conversation(db, conversation.id)


def conversation_to_list_item_for_customer(
    db: Session,
    conversation: Conversation,
) -> ConversationListItem:
    conversation = _load_conversation(db, conversation.id)
    return _conversation_list_item(
        conversation,
        unread_count=_unread_count(db, conversation.id, for_sender_type=SenderType.SELLER),
    )


def _list_conversations(
    db: Session,
    query,
    *,
    unread_sender_type: SenderType,
    page: int | None = None,
    page_size: int | None = None,
) -> list[ConversationListItem]:
    query = query.order_by(Conversation.updated_at.desc())
    if page is not None and page_size is not None:
        query = query.limit(page_size).offset((page - 1) * page_size)
    conversations = db.scalars(query).unique().all()
    items: list[ConversationListItem] = []
    for conversation in conversations:
        store = conversation.store
        if store is None:
            continue
        items.append(
            ConversationListItem(
                id=conversation.id,
                store_id=conversation.store_id,
                store_name=store.name,
                store_slug=store.slug,
                customer_id=conversation.customer_id,
                customer_name=_customer_name_from_conversation(conversation),
                order_id=conversation.order_id,
                invoice_code=_order_invoice_code(conversation),
                order_status=_order_status(conversation),
                unread_count=_unread_count(db, conversation.id, for_sender_type=unread_sender_type),
                last_message_body=conversation.messages[-1].body if conversation.messages else None,
                last_message_at=conversation.messages[-1].created_at if conversation.messages else None,
                updated_at=conversation.updated_at,
            )
        )
    return items


def list_customer_conversations(
    db: Session,
    customer_id: int,
    *,
    page: int = 1,
    page_size: int = 20,
) -> ConversationListResponse:
    filters = or_(
        Conversation.customer_id == customer_id,
        Order.customer_id == customer_id,
    )
    query = (
        _conversation_query()
        .outerjoin(Order, Conversation.order_id == Order.id)
        .where(filters)
    )
    total = (
        db.scalar(
            select(func.count(Conversation.id))
            .select_from(Conversation)
            .outerjoin(Order, Conversation.order_id == Order.id)
            .where(filters)
        )
        or 0
    )
    items = _list_conversations(
        db,
        query,
        unread_sender_type=SenderType.SELLER,
        page=page,
        page_size=page_size,
    )
    return ConversationListResponse(items=items, total=total, page=page, page_size=page_size)


def list_seller_conversations(
    db: Session,
    store_id: int,
    *,
    page: int = 1,
    page_size: int = 20,
) -> ConversationListResponse:
    query = _conversation_query().where(Conversation.store_id == store_id)
    total = (
        db.scalar(
            select(func.count(Conversation.id)).where(Conversation.store_id == store_id)
        )
        or 0
    )
    items = _list_conversations(
        db,
        query,
        unread_sender_type=SenderType.CUSTOMER,
        page=page,
        page_size=page_size,
    )
    return ConversationListResponse(items=items, total=total, page=page, page_size=page_size)


def list_admin_conversations(db: Session) -> list[ConversationListItem]:
    query = _conversation_query()
    return _list_conversations(db, query, unread_sender_type=SenderType.CUSTOMER)


def _build_detail(conversation: Conversation) -> ConversationDetailResponse:
    return ConversationDetailResponse(
        id=conversation.id,
        store_id=conversation.store_id,
        store_name=conversation.store.name if conversation.store else "",
        store_slug=conversation.store.slug if conversation.store else "",
        customer_id=conversation.customer_id,
        customer_name=_customer_name_from_conversation(conversation),
        order_id=conversation.order_id,
        invoice_code=_order_invoice_code(conversation),
        order_status=_order_status(conversation),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[_message_to_response(message) for message in conversation.messages],
    )


def get_customer_conversation_detail(
    db: Session,
    conversation_id: int,
    customer_id: int,
) -> ConversationDetailResponse:
    conversation = _load_conversation(db, conversation_id)
    if not (
        conversation.customer_id == customer_id
        or (conversation.order is not None and conversation.order.customer_id == customer_id)
    ):
        raise ServiceError("Conversation not found", status_code=404)

    _mark_messages_read(db, conversation_id, reader_is_customer=True)
    db.commit()
    conversation = _load_conversation(db, conversation_id)
    return _build_detail(conversation)


def get_seller_conversation_detail(
    db: Session,
    conversation_id: int,
    store_id: int,
) -> ConversationDetailResponse:
    conversation = _load_conversation(db, conversation_id)
    if conversation.store_id != store_id:
        raise ServiceError("Conversation not found", status_code=404)

    _mark_messages_read(db, conversation_id, reader_is_customer=False)
    db.commit()
    conversation = _load_conversation(db, conversation_id)
    return _build_detail(conversation)


def get_admin_conversation_detail(
    db: Session,
    conversation_id: int,
) -> ConversationDetailResponse:
    conversation = _load_conversation(db, conversation_id)
    return _build_detail(conversation)


def _send_message(
    db: Session,
    conversation: Conversation,
    *,
    sender_type: SenderType,
    sender_user_id: int | None,
    payload: MessageCreate,
) -> MessageResponse:
    message = Message(
        conversation_id=conversation.id,
        sender_type=sender_type,
        sender_user_id=sender_user_id,
        body=payload.body.strip(),
        attachment_url=payload.attachment_url,
        attachment_mime_type=payload.attachment_mime_type,
        is_read=False,
    )
    conversation.updated_at = datetime.now(UTC)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_to_response(message)


def send_customer_message(
    db: Session,
    conversation_id: int,
    customer_id: int,
    payload: MessageCreate,
) -> MessageResponse:
    conversation = _load_conversation(db, conversation_id)
    if not (
        conversation.customer_id == customer_id
        or (conversation.order is not None and conversation.order.customer_id == customer_id)
    ):
        raise ServiceError("Conversation not found", status_code=404)
    return _send_message(
        db,
        conversation,
        sender_type=SenderType.CUSTOMER,
        sender_user_id=None,
        payload=payload,
    )


def send_public_order_message(
    db: Session,
    order_id: int,
    payload: MessageCreate,
) -> MessageResponse:
    order = _get_order(db, order_id)
    conversation = get_or_create_conversation(
        db,
        order_id=order.id,
        customer_id=order.customer_id,
        store_id=order.store_id,
    )
    return _send_message(
        db,
        conversation,
        sender_type=SenderType.CUSTOMER,
        sender_user_id=None,
        payload=payload,
    )


def send_seller_message(
    db: Session,
    conversation_id: int,
    store_id: int,
    seller: User,
    payload: MessageCreate,
) -> MessageResponse:
    conversation = _load_conversation(db, conversation_id)
    if conversation.store_id != store_id:
        raise ServiceError("Conversation not found", status_code=404)
    return _send_message(
        db,
        conversation,
        sender_type=SenderType.SELLER,
        sender_user_id=seller.id,
        payload=payload,
    )


def send_admin_message(
    db: Session,
    conversation_id: int,
    admin: User,
    payload: MessageCreate,
) -> MessageResponse:
    conversation = _load_conversation(db, conversation_id)
    return _send_message(
        db,
        conversation,
        sender_type=SenderType.SELLER,
        sender_user_id=admin.id,
        payload=payload,
    )
