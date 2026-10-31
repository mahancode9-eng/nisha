from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import OrderStatus, PaymentMethodType
from app.schemas.order_item import OrderItemFieldValueResponse
from app.schemas.public import PublicPaymentMethod, PublicStoreProfile


class OrderTrackRequest(BaseModel):
    invoice_code: str
    invoice_edit_password: str


class OrderInvoicePreviewResponse(BaseModel):
    """Public, password-free snippet for Open Graph / share previews."""

    invoice_code: str
    status: OrderStatus
    store_name: str
    total_amount: Decimal
    currency_label: str = "تومان"
    store_logo_url: str | None = None


class GuestOrderEdit(BaseModel):
    invoice_edit_password: str
    buyer_name: str | None = Field(default=None, min_length=1, max_length=255)
    buyer_phone: str | None = Field(default=None, min_length=1, max_length=50)
    buyer_address: str | None = Field(default=None, min_length=1)
    buyer_note: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def require_edit_field(self) -> "GuestOrderEdit":
        if not any(
            field in self.model_fields_set
            for field in ("buyer_name", "buyer_phone", "buyer_address", "buyer_note")
        ):
            raise ValueError("At least one field must be provided to edit")
        return self


class PaymentProofResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    payer_card_last4: str | None = None
    transfer_tracking: str | None = None
    ocr_status: str = "pending"
    ocr_amount: Decimal | None = None
    ocr_dest_card_last4: str | None = None
    ocr_amount_matched: bool | None = None
    ocr_dest_card_matched: bool | None = None
    ocr_confidence: Decimal | None = None
    uploaded_at: datetime

    @field_validator("image_url", mode="after")
    @classmethod
    def sign_private_proof_url(cls, value: str) -> str:
        from app.services.private_media_service import sign_private_media_url

        return sign_private_media_url(value)


class PaymentProofUploadResponse(BaseModel):
    message: str
    order_status: OrderStatus
    proof: PaymentProofResponse
    duplicate_warning: bool = False
    duplicate_invoice_codes: list[str] = Field(default_factory=list)


class OrderTrackItemResponse(BaseModel):
    product_id: int | None
    product_title: str
    variant_name: str | None = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    field_values: list[OrderItemFieldValueResponse] = Field(default_factory=list)


class OrderStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    old_status: OrderStatus | None
    new_status: OrderStatus
    note: str | None
    created_at: datetime


class OrderTrackResponse(BaseModel):
    order_id: int
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
    tracking_code: str | None = None
    created_at: datetime
    items: list[OrderTrackItemResponse]
    payment_proofs: list[PaymentProofResponse]
    store: PublicStoreProfile
    payment_method: PublicPaymentMethod


class GuestOrderEditResponse(BaseModel):
    message: str
    order_id: int
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    buyer_address: str
    buyer_note: str | None
