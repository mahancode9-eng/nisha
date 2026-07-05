from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OrderStatus, PaymentMethodType
from app.schemas.public import PublicPaymentMethod, PublicStoreProfile


class OrderTrackRequest(BaseModel):
    invoice_code: str
    invoice_edit_password: str


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
    uploaded_at: datetime


class PaymentProofUploadResponse(BaseModel):
    message: str
    order_status: OrderStatus
    proof: PaymentProofResponse


class OrderTrackItemResponse(BaseModel):
    product_id: int | None
    product_title: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


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
    total_amount: Decimal
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
