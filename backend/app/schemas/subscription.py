from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BillingPeriod, SellerSubscriptionStatus, SubscriptionInvoiceStatus


class SubscriptionPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name_fa: str
    monthly_price_toman: int
    quarterly_price_toman: int
    yearly_price_toman: int
    is_recommended: bool
    sort_order: int
    is_active: bool
    entitlements: dict[str, Any]


class SubscriptionPlanUpdate(BaseModel):
    name_fa: str | None = None
    monthly_price_toman: int | None = Field(default=None, ge=0)
    quarterly_price_toman: int | None = Field(default=None, ge=0)
    yearly_price_toman: int | None = Field(default=None, ge=0)
    is_recommended: bool | None = None
    sort_order: int | None = None
    is_active: bool | None = None
    entitlements: dict[str, Any] | None = None


class SellerSubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan: SubscriptionPlanResponse
    status: SellerSubscriptionStatus
    billing_period: BillingPeriod
    current_period_start: datetime | None
    current_period_end: datetime | None
    started_at: datetime


class SellerSubscriptionDetailResponse(BaseModel):
    subscription: SellerSubscriptionResponse
    effective_plan: SubscriptionPlanResponse
    entitlements: dict[str, Any]
    is_expired_fallback: bool


class SubscriptionCheckoutRequest(BaseModel):
    plan_code: str
    period: BillingPeriod = BillingPeriod.MONTHLY


class SubscriptionPaymentProofResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    uploaded_at: datetime


class SubscriptionInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan: SubscriptionPlanResponse
    period: BillingPeriod
    amount_toman: int
    status: SubscriptionInvoiceStatus
    period_start: datetime | None
    period_end: datetime | None
    admin_note: str | None = None
    created_at: datetime
    proofs: list[SubscriptionPaymentProofResponse] = []


class CardInstructionsResponse(BaseModel):
    card_number: str
    card_owner: str
    card_bank: str
    message: str


class PaymentSessionResponse(BaseModel):
    provider: str
    mode: str
    instructions: dict[str, Any]
    redirect_url: str | None = None
    external_reference: str | None = None


class SubscriptionCheckoutResponse(BaseModel):
    invoice: SubscriptionInvoiceResponse
    payment: PaymentSessionResponse
    card_instructions: CardInstructionsResponse


class AdminSubscriptionInvoiceResponse(SubscriptionInvoiceResponse):
    seller_user_id: int
    seller_email: str | None = None
    seller_full_name: str | None = None


class AdminInvoiceActionRequest(BaseModel):
    admin_note: str | None = None


class AdminAssignPlanRequest(BaseModel):
    plan_code: str
    period: BillingPeriod = BillingPeriod.MONTHLY
    months: int = Field(default=1, ge=1, le=36)
