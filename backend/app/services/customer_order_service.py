from __future__ import annotations

from datetime import UTC, datetime
from html import escape

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer_account import CustomerAccount
from app.models.customer_portal import CustomerOrderReceipt, CustomerReview, OrderClaim, OrderComplaint
from app.models.enums import ComplaintStatus, CustomerReceiptStatus, OrderStatus
from app.models.order import Order
from app.schemas.customer_portal import (
    CustomerAddressResponse,
    CustomerComplaintCreateRequest,
    CustomerComplaintResponse,
    CustomerDashboardSummary,
    CustomerInvoiceDownloadResponse,
    CustomerOrderActionResponse,
    CustomerOrderClaimRequest,
    CustomerOrderDetailResponse,
    CustomerOrderItemResponse,
    CustomerOrderListItem,
    CustomerOrderReceiptUpdateRequest,
    CustomerProfileResponse,
    CustomerReviewCreateRequest,
    CustomerReviewResponse,
)
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse
from app.schemas.public import PublicStoreProfile
from app.services import chat_service, order_access_service, review_service
from app.services.customer_profile_service import list_addresses
from app.services.exceptions import ServiceError

ACTIVE_STATUSES = {
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PAYMENT_UPLOADED,
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
}


def get_owned_order(db: Session, customer_id: int, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment_method),
            selectinload(Order.payment_proofs),
            selectinload(Order.status_history),
            selectinload(Order.store),
            selectinload(Order.receipt),
            selectinload(Order.complaints),
            selectinload(Order.conversations),
        )
        .where(Order.id == order_id, Order.customer_id == customer_id)
    )
    if order is None:
        raise ServiceError("سفارش پیدا نشد", status_code=404)
    return order


def _receipt_status(order: Order) -> CustomerReceiptStatus | None:
    if order.receipt is None:
        return None
    return order.receipt.status


def _complaint_count(order: Order) -> int:
    return len(order.complaints)


def _build_order_item(item) -> CustomerOrderItemResponse:
    return CustomerOrderItemResponse(
        id=getattr(item, "id", None),
        product_id=item.product_id,
        product_title_snapshot=item.product_title_snapshot,
        unit_price_snapshot=item.unit_price_snapshot,
        quantity=item.quantity,
        total_price=item.total_price,
    )


def _build_detail(order: Order) -> CustomerOrderDetailResponse:
    return CustomerOrderDetailResponse(
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
        receipt_status=_receipt_status(order),
        complaint_count=_complaint_count(order),
        stock_restored=order.stock_restored,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[_build_order_item(item) for item in order.items],
        payment_method=PaymentMethodResponse.model_validate(order.payment_method),
        payment_proofs=[PaymentProofResponse.model_validate(proof) for proof in order.payment_proofs],
        status_history=[OrderStatusHistoryResponse.model_validate(history) for history in order.status_history],
        store=PublicStoreProfile.model_validate(order.store),
    )


def list_customer_orders(
    db: Session,
    customer_id: int,
    *,
    active_only: bool = False,
) -> list[CustomerOrderListItem]:
    query = (
        select(Order)
        .options(selectinload(Order.receipt), selectinload(Order.complaints))
        .where(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc())
    )
    orders = list(db.scalars(query).all())
    if active_only:
        orders = [order for order in orders if order.status in ACTIVE_STATUSES]
    return [
        CustomerOrderListItem(
            id=order.id,
            invoice_code=order.invoice_code,
            status=order.status,
            buyer_name=order.buyer_name,
            buyer_phone=order.buyer_phone,
            buyer_address=order.buyer_address,
            total_amount=order.total_amount,
            customer_id=order.customer_id,
            receipt_status=_receipt_status(order),
            complaint_count=_complaint_count(order),
            created_at=order.created_at,
        )
        for order in orders
    ]


def get_customer_order_detail(db: Session, customer_id: int, order_id: int) -> CustomerOrderDetailResponse:
    order = get_owned_order(db, customer_id, order_id)
    return _build_detail(order)


def claim_order(
    db: Session,
    customer: CustomerAccount,
    payload: CustomerOrderClaimRequest,
) -> CustomerOrderActionResponse:
    order = order_access_service.authenticate_order(
        db,
        payload.invoice_code,
        payload.invoice_password,
    )

    claim = db.scalar(
        select(OrderClaim)
        .where(OrderClaim.order_id == order.id)
        .with_for_update()
    )
    if order.customer_id is not None and order.customer_id != customer.id:
        raise ServiceError("این سفارش قبلا توسط مشتری دیگری ثبت شده است", status_code=409)

    if order.customer_id is None:
        order.customer_id = customer.id
    db.flush()
    chat_service.get_or_create_conversation(
        db,
        customer_id=customer.id,
        order_id=order.id,
        store_id=order.store_id,
    )
    if claim is None:
        db.add(
            OrderClaim(
                order_id=order.id,
                customer_id=customer.id,
                invoice_code=order.invoice_code,
            )
        )
    db.commit()

    db.refresh(order)
    return CustomerOrderActionResponse(
        message="سفارش با موفقیت ثبت شد",
        order_id=order.id,
        status=order.status,
    )


def set_receipt_status(
    db: Session,
    customer_id: int,
    order_id: int,
    payload: CustomerOrderReceiptUpdateRequest,
) -> CustomerOrderActionResponse:
    order = get_owned_order(db, customer_id, order_id)
    receipt = db.scalar(select(CustomerOrderReceipt).where(CustomerOrderReceipt.order_id == order.id))
    if receipt is None:
        receipt = CustomerOrderReceipt(
            order_id=order.id,
            customer_id=customer_id,
            status=payload.receipt_status,
        )
    else:
        receipt.status = payload.receipt_status
        receipt.customer_id = customer_id
    db.add(receipt)
    db.commit()
    return CustomerOrderActionResponse(
        message="وضعیت رسید به‌روزرسانی شد",
        order_id=order.id,
        status=order.status,
        receipt_status=payload.receipt_status,
    )


def list_complaints(db: Session, customer_id: int) -> list[CustomerComplaintResponse]:
    complaints = list(
        db.scalars(
            select(OrderComplaint)
            .where(OrderComplaint.customer_id == customer_id)
            .order_by(OrderComplaint.created_at.desc())
        ).all()
    )
    return [CustomerComplaintResponse.model_validate(item) for item in complaints]


def create_complaint(
    db: Session,
    customer_id: int,
    order_id: int,
    payload: CustomerComplaintCreateRequest,
) -> CustomerComplaintResponse:
    order = get_owned_order(db, customer_id, order_id)
    if order.status not in {OrderStatus.PAYMENT_CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED}:
        raise ServiceError("اعتراض فقط برای سفارش‌های در حال ارسال فعال است", status_code=422)

    complaint = db.scalar(select(OrderComplaint).where(OrderComplaint.order_id == order.id))
    if complaint is None:
        now = datetime.now(UTC)
        complaint = OrderComplaint(
            order_id=order.id,
            customer_id=customer_id,
            reason=payload.reason,
            message=payload.message.strip(),
            status=ComplaintStatus.OPEN,
            seller_notified_at=now,
            admin_notified_at=now,
        )
    else:
        complaint.reason = payload.reason
        complaint.message = payload.message.strip()
        complaint.status = ComplaintStatus.OPEN
        complaint.seller_notified_at = datetime.now(UTC)
        complaint.admin_notified_at = datetime.now(UTC)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return CustomerComplaintResponse.model_validate(complaint)


def list_reviews(db: Session, customer_id: int) -> list[CustomerReviewResponse]:
    return review_service.list_customer_reviews(db, customer_id)


def create_review(
    db: Session,
    customer_id: int,
    payload: CustomerReviewCreateRequest,
) -> CustomerReviewResponse:
    order = get_owned_order(db, customer_id, payload.order_id)
    return review_service.create_or_update_review(
        db,
        order=order,
        customer_id=customer_id,
        payload=payload,
    )


def build_invoice_download(order: Order) -> CustomerInvoiceDownloadResponse:
    rows = "\n".join(
        f"<tr><td>{escape(item.product_title_snapshot)}</td><td>{item.quantity}</td><td>{escape(str(item.unit_price_snapshot))}</td><td>{escape(str(item.total_price))}</td></tr>"
        for item in order.items
    )
    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice {escape(order.invoice_code)}</title>
  <style>
    body {{ font-family: Arial, sans-serif; color: #111; padding: 32px; }}
    h1 {{ margin: 0 0 8px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
    th, td {{ border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }}
    .meta {{ color: #555; font-size: 14px; }}
    .total {{ text-align: right; margin-top: 16px; font-weight: bold; }}
  </style>
</head>
<body>
  <h1>{escape(order.store.name)}</h1>
  <p class="meta">Invoice: {escape(order.invoice_code)}</p>
  <p class="meta">Status: {escape(order.status.value)}</p>
  <p class="meta">Buyer: {escape(order.buyer_name)} | {escape(order.buyer_phone)}</p>
  <p class="meta">{escape(order.buyer_address)}</p>
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <p class="total">Subtotal: {escape(str(order.subtotal_amount))} | Total: {escape(str(order.total_amount))}</p>
</body>
</html>"""
    return CustomerInvoiceDownloadResponse(
        filename=f"invoice-{order.invoice_code}.html",
        content_type="text/html; charset=utf-8",
        content=html,
    )


def get_dashboard_summary(db: Session, customer: CustomerAccount) -> CustomerDashboardSummary:
    recent_orders = list_customer_orders(db, customer.id)[:5]
    total_orders = db.scalar(select(func.count()).select_from(Order).where(Order.customer_id == customer.id)) or 0
    active_orders = db.scalar(
        select(func.count()).select_from(Order).where(
            Order.customer_id == customer.id,
            Order.status.in_(ACTIVE_STATUSES),
        )
    ) or 0
    complaints = db.scalar(
        select(func.count()).select_from(OrderComplaint).where(OrderComplaint.customer_id == customer.id)
    ) or 0
    reviews = db.scalar(
        select(func.count()).select_from(CustomerReview).where(CustomerReview.customer_id == customer.id)
    ) or 0
    chats = len(chat_service.list_customer_conversations(db, customer.id))
    downloads = total_orders
    return CustomerDashboardSummary(
        total_orders=total_orders,
        active_orders=active_orders,
        complaints=complaints,
        downloads=downloads,
        chats=chats,
        reviews=reviews,
        recent_orders=recent_orders,
        profile=CustomerProfileResponse.model_validate(customer),
        addresses=[CustomerAddressResponse.model_validate(address) for address in list_addresses(db, customer.id)],
    )
