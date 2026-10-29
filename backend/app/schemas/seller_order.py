from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CustomerReceiptStatus, OrderStatus, PaymentMethodType
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.order_item import OrderItemFieldValueResponse
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
    conversation_id: int | None = None
    payment_proof_count: int = 0
    is_manual: bool = False
    created_at: datetime


class SellerOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None
    variant_id: int | None = None
    variant_name_snapshot: str | None = None
    product_title_snapshot: str
    unit_price_snapshot: Decimal
    quantity: int
    total_price: Decimal
    field_values: list[OrderItemFieldValueResponse] = Field(default_factory=list)


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
    discount_code: str | None = None
    discount_amount: Decimal = Decimal("0")
    shipping_amount: Decimal = Decimal("0")
    total_amount: Decimal
    customer_id: int | None = None
    receipt_status: CustomerReceiptStatus | None = None
    complaint_count: int = 0
    conversation_id: int | None = None
    payment_proof_count: int = 0
    stock_restored: bool
    tracking_code: str | None = None
    is_manual: bool = False
    shipping_method_id: int | None = None
    shipping_method_name: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[SellerOrderItemResponse]
    payment_method: PaymentMethodResponse
    payment_proofs: list[PaymentProofResponse]
    status_history: list[OrderStatusHistoryResponse]


class SellerOrderStatusUpdate(BaseModel):
    status: Literal["PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]
    note: str | None = None
    tracking_code: str | None = Field(default=None, max_length=100)


class SellerOrderTrackingUpdate(BaseModel):
    tracking_code: str = Field(min_length=1, max_length=100)


class SellerOrderActionResponse(BaseModel):
    message: str
    order_id: int
    status: OrderStatus
    tracking_code: str | None = None


class SellerOrderConversationResponse(BaseModel):
    conversation_id: int


class ManualOrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)


class ManualOrderCreate(BaseModel):
    buyer_name: str = Field(min_length=1, max_length=255)
    buyer_phone: str = Field(min_length=1, max_length=50)
    buyer_address: str = Field(min_length=1)
    buyer_note: str | None = Field(default=None, max_length=1000)
    payment_method_id: int
    items: list[ManualOrderItemInput] = Field(min_length=1)
    mark_paid: bool = False


class ManualOrderCreateResponse(BaseModel):
    order_id: int
    invoice_code: str
    invoice_edit_password: str
    status: OrderStatus
    is_manual: bool = True
