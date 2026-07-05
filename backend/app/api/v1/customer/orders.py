from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.customer_portal import (
    CustomerComplaintCreateRequest,
    CustomerComplaintResponse,
    CustomerOrderActionResponse,
    CustomerOrderClaimRequest,
    CustomerOrderDetailResponse,
    CustomerOrderListItem,
    CustomerOrderReceiptUpdateRequest,
    CustomerReviewCreateRequest,
    CustomerReviewResponse,
)
from app.services.auth_service import AuthError
from app.services.customer_order_service import (
    claim_order,
    create_complaint,
    create_review,
    get_customer_order_detail,
    build_invoice_download,
    get_owned_order,
    list_complaints,
    list_customer_orders,
    list_reviews,
    set_receipt_status,
)
from app.services.exceptions import ServiceError

router = APIRouter(tags=["customer-orders"])


@router.get("/orders", response_model=list[CustomerOrderListItem])
def get_orders(
    active_only: bool = Query(default=False),
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerOrderListItem]:
    return list_customer_orders(db, customer.id, active_only=active_only)


@router.get("/orders/active", response_model=list[CustomerOrderListItem])
def get_active_orders(
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerOrderListItem]:
    return list_customer_orders(db, customer.id, active_only=True)


@router.get("/orders/{order_id}", response_model=CustomerOrderDetailResponse)
def get_order(
    order_id: int,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderDetailResponse:
    try:
        return get_customer_order_detail(db, customer.id, order_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/orders/claim", response_model=CustomerOrderActionResponse)
def claim_existing_order(
    payload: CustomerOrderClaimRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderActionResponse:
    try:
        return claim_order(db, customer, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/orders/{order_id}/receipt", response_model=CustomerOrderActionResponse)
def mark_receipt(
    order_id: int,
    payload: CustomerOrderReceiptUpdateRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderActionResponse:
    try:
        return set_receipt_status(db, customer.id, order_id, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/orders/{order_id}/complaints", response_model=CustomerComplaintResponse)
def create_order_complaint(
    order_id: int,
    payload: CustomerComplaintCreateRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerComplaintResponse:
    try:
        return create_complaint(db, customer.id, order_id, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/complaints", response_model=list[CustomerComplaintResponse])
def get_my_complaints(
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerComplaintResponse]:
    return list_complaints(db, customer.id)


@router.post("/reviews", response_model=CustomerReviewResponse, status_code=status.HTTP_201_CREATED)
def create_customer_review(
    payload: CustomerReviewCreateRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerReviewResponse:
    try:
        return create_review(db, customer.id, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/reviews", response_model=list[CustomerReviewResponse])
def get_my_reviews(
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerReviewResponse]:
    return list_reviews(db, customer.id)


@router.get("/orders/{order_id}/invoice")
def download_invoice(
    order_id: int,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> Response:
    try:
        full_order = get_owned_order(db, customer.id, order_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    download = build_invoice_download(full_order)
    return Response(
        content=download.content,
        media_type=download.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{download.filename}"',
        },
    )
