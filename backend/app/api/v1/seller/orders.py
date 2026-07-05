from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store, require_seller
from app.db.session import get_db
from app.models.enums import OrderStatus
from app.models.store import Store
from app.models.user import User
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.schemas.seller_order import (
    SellerOrderActionResponse,
    SellerOrderDetailResponse,
    SellerOrderItemResponse,
    SellerOrderListItem,
    SellerOrderStatusUpdate,
)
from app.services import seller_order_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/orders", tags=["seller-orders"])


@router.get("", response_model=PaginatedResponse[SellerOrderListItem])
def list_orders(
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> PaginatedResponse[SellerOrderListItem]:
    orders, total = seller_order_service.list_orders_paginated(
        db,
        store,
        page=page,
        page_size=page_size,
        status=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    items = [
        SellerOrderListItem(
            id=order.id,
            invoice_code=order.invoice_code,
            status=order.status,
            buyer_name=order.buyer_name,
            buyer_phone=order.buyer_phone,
            total_amount=order.total_amount,
            customer_id=order.customer_id,
            receipt_status=order.receipt.status if order.receipt else None,
            complaint_count=len(order.complaints),
            created_at=order.created_at,
        )
        for order in orders
    ]
    return build_paginated_response(items, total, page, page_size)


@router.get("/{order_id}", response_model=SellerOrderDetailResponse)
def get_order(
    order_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SellerOrderDetailResponse:
    try:
        order = seller_order_service.get_order_for_store(db, store, order_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return SellerOrderDetailResponse(
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
        receipt_status=order.receipt.status if order.receipt else None,
        complaint_count=len(order.complaints),
        stock_restored=order.stock_restored,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[SellerOrderItemResponse.model_validate(item) for item in order.items],
        payment_method=PaymentMethodResponse.model_validate(order.payment_method),
        payment_proofs=[PaymentProofResponse.model_validate(p) for p in order.payment_proofs],
        status_history=[OrderStatusHistoryResponse.model_validate(h) for h in order.status_history],
    )


@router.post("/{order_id}/confirm-payment", response_model=SellerOrderActionResponse)
def confirm_payment(
    order_id: int,
    store: Store = Depends(get_seller_store),
    seller: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SellerOrderActionResponse:
    try:
        order = seller_order_service.confirm_payment(db, store, order_id, seller)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return SellerOrderActionResponse(
        message="پرداخت تایید شد",
        order_id=order.id,
        status=order.status,
    )


@router.post("/{order_id}/reject-payment", response_model=SellerOrderActionResponse)
def reject_payment(
    order_id: int,
    store: Store = Depends(get_seller_store),
    seller: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SellerOrderActionResponse:
    try:
        order = seller_order_service.reject_payment(db, store, order_id, seller)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return SellerOrderActionResponse(
        message="پرداخت رد شد",
        order_id=order.id,
        status=order.status,
    )


@router.patch("/{order_id}/status", response_model=SellerOrderActionResponse)
def update_order_status(
    order_id: int,
    payload: SellerOrderStatusUpdate,
    store: Store = Depends(get_seller_store),
    seller: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SellerOrderActionResponse:
    try:
        order = seller_order_service.update_order_status(
            db,
            store,
            order_id,
            seller,
            target_status=OrderStatus(payload.status),
            note=payload.note,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return SellerOrderActionResponse(
        message="وضعیت سفارش به‌روزرسانی شد",
        order_id=order.id,
        status=order.status,
    )
