from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.enums import OrderStatus
from app.models.user import User
from app.schemas.admin import AdminOrderDetailResponse, AdminOrderListItem, AdminOrderUpdateRequest
from app.schemas.chat import ConversationDetailResponse
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.services import admin_order_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/orders", tags=["admin-orders"])


@router.get("", response_model=PaginatedResponse[AdminOrderListItem])
def list_orders(
    store_id: int | None = None,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AdminOrderListItem]:
    items, total = admin_order_service.list_orders_paginated(
        db,
        page=page,
        page_size=page_size,
        store_id=store_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    return build_paginated_response(items, total, page, page_size)


@router.get("/{order_id}", response_model=AdminOrderDetailResponse)
def get_order(
    order_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminOrderDetailResponse:
    try:
        return admin_order_service.get_order_detail_response(db, order_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/{order_id}/chat", response_model=ConversationDetailResponse)
def get_order_chat(
    order_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    try:
        conversation = admin_order_service.get_order_chat_detail(db, order_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    if conversation is None:
        raise HTTPException(status_code=404, detail="گفتگو پیدا نشد")
    return conversation


@router.patch("/{order_id}", response_model=AdminOrderDetailResponse)
def update_order(
    order_id: int,
    payload: AdminOrderUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminOrderDetailResponse:
    try:
        return admin_order_service.update_order(db, order_id, payload, admin=_)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
