from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ComplaintStatus, CustomerReceiptStatus, RecoveryChannel, OrderStatus, ReviewStatus
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse
from app.schemas.public import GuestOrderCreate, PublicPaymentMethod, PublicStoreProfile


class CustomerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str | None
    phone: str | None
    postal_code: str | None
    full_name: str


class CustomerProfileUpdateRequest(BaseModel):
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    full_name: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def require_one_field(self) -> "CustomerProfileUpdateRequest":
        if not any(
            field in self.model_fields_set for field in ("email", "phone", "postal_code", "full_name")
        ):
            raise ValueError("At least one field must be provided")
        return self


class CustomerAddressBase(BaseModel):
    label: str | None = Field(default=None, max_length=255)
    recipient_name: str = Field(min_length=1, max_length=255)
    recipient_phone: str = Field(min_length=1, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    address_line1: str = Field(min_length=1)
    address_line2: str | None = None
    city: str | None = Field(default=None, max_length=255)
    province: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=100)
    is_default: bool = False


class CustomerAddressCreateRequest(CustomerAddressBase):
    pass


class CustomerAddressUpdateRequest(BaseModel):
    label: str | None = Field(default=None, max_length=255)
    recipient_name: str | None = Field(default=None, max_length=255)
    recipient_phone: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = Field(default=None, max_length=255)
    province: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=100)
    is_default: bool | None = None

    @model_validator(mode="after")
    def require_one_field(self) -> "CustomerAddressUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class CustomerAddressResponse(CustomerAddressBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CustomerRecoveryRequest(BaseModel):
    login: str = Field(min_length=1)
    channel: RecoveryChannel


class CustomerRecoveryStartResponse(BaseModel):
    recovery_id: int
    channel: RecoveryChannel
    expires_at: datetime
    delivery_hint: str | None = None
    debug_code: str | None = None


class CustomerRecoveryVerifyRequest(BaseModel):
    recovery_id: int
    code: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=8)


class CustomerRecoveryVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerProfileResponse


class CustomerOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    product_id: int | None
    product_title_snapshot: str
    unit_price_snapshot: Decimal
    quantity: int
    total_price: Decimal


class CustomerOrderClaimRequest(BaseModel):
    invoice_code: str = Field(min_length=1)
    invoice_password: str = Field(min_length=1)


class CustomerOrderReceiptUpdateRequest(BaseModel):
    receipt_status: CustomerReceiptStatus


class CustomerComplaintCreateRequest(BaseModel):
    reason: str = Field(default="NON_DELIVERY", max_length=100)
    message: str = Field(min_length=1)


class CustomerComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    reason: str
    message: str
    status: ComplaintStatus
    seller_notified_at: datetime | None
    admin_notified_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CustomerReviewCreateRequest(BaseModel):
    order_id: int
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=255)
    comment: str | None = None
    is_public: bool = False
    image_urls: list[str] = Field(default_factory=list)


class CustomerReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    store_id: int
    rating: int
    title: str | None
    comment: str | None
    status: ReviewStatus
    image_urls: list[str] = Field(default_factory=list)
    is_public: bool = False
    moderation_note: str | None = None
    created_at: datetime
    updated_at: datetime


class CustomerOrderListItem(BaseModel):
    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    buyer_address: str
    total_amount: Decimal
    customer_id: int | None
    receipt_status: CustomerReceiptStatus | None
    complaint_count: int = 0
    created_at: datetime


class CustomerOrderDetailResponse(BaseModel):
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
    customer_id: int | None
    receipt_status: CustomerReceiptStatus | None
    complaint_count: int = 0
    stock_restored: bool
    created_at: datetime
    updated_at: datetime
    items: list[CustomerOrderItemResponse]
    payment_method: PaymentMethodResponse
    payment_proofs: list[PaymentProofResponse]
    status_history: list[OrderStatusHistoryResponse]
    store: PublicStoreProfile


class CustomerOrderActionResponse(BaseModel):
    message: str
    order_id: int
    status: OrderStatus | None = None
    receipt_status: CustomerReceiptStatus | None = None


class CustomerInvoiceDownloadResponse(BaseModel):
    filename: str
    content_type: str
    content: str


class CustomerCheckoutCreate(GuestOrderCreate):
    save_address: bool = False
    address_label: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=50)
    address_line2: str | None = None
    city: str | None = Field(default=None, max_length=255)
    province: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=100)


class CustomerDashboardSummary(BaseModel):
    total_orders: int
    active_orders: int
    complaints: int
    downloads: int
    chats: int
    reviews: int
    recent_orders: list[CustomerOrderListItem]
    profile: CustomerProfileResponse
    addresses: list[CustomerAddressResponse]
