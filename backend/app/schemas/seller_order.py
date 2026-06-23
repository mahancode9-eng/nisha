from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CustomerReceiptStatus, OrderStatus, PaymentMethodType
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse


class SellerOrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    total_amount: Decimal
    customer_id: int | None = None
    receipt_status: CustomerReceiptStatus | None = None
    complaint_count: int = 0
    created_at: datetime


class SellerOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None
    product_title_snapshot: str
    unit_price_snapshot: Decimal
    quantity: int
    total_price: Decimal


class SellerOrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    buyer_address: str
    buyer_note: str | None
    subtotal_amount: Decimal
    total_amount: Decimal
    customer_id: int | None = None
    receipt_status: CustomerReceiptStatus | None = None
    complaint_count: int = 0
    stock_restored: bool
    created_at: datetime
    updated_at: datetime
    items: list[SellerOrderItemResponse]
    payment_method: PaymentMethodResponse
    payment_proofs: list[PaymentProofResponse]
    status_history: list[OrderStatusHistoryResponse]


class SellerOrderStatusUpdate(BaseModel):
    status: Literal["PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]
    note: str | None = None


class SellerOrderActionResponse(BaseModel):
    message: str
    order_id: int
    status: OrderStatus
