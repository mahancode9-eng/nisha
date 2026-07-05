from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import StoreOnboardingStatus, StoreOnboardingStep
from app.schemas.public import PublicHomepageCategory
from app.schemas.store import StoreResponse


class StoreOnboardingEvent(BaseModel):
    type: str
    step: StoreOnboardingStep | None = None
    timestamp: datetime


class StoreOnboardingIdentityDraft(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    logo_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)


class StoreOnboardingInformationDraft(BaseModel):
    description: str | None = None
    category_slug: str | None = Field(default=None, max_length=100)
    category_name: str | None = Field(default=None, max_length=255)
    location: str | None = None


class StoreOnboardingContactChannelDraft(BaseModel):
    platform: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=500)
    is_active: bool = True


class StoreOnboardingFirstProductDraft(BaseModel):
    product_id: int | None = None
    title: str | None = Field(default=None, max_length=255)
    price: Decimal | None = Field(default=None, gt=0)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    stock_quantity: int = Field(default=1, ge=0)
    is_active: bool = True


class StoreOnboardingDrafts(BaseModel):
    store_identity: StoreOnboardingIdentityDraft = Field(default_factory=StoreOnboardingIdentityDraft)
    store_information: StoreOnboardingInformationDraft = Field(default_factory=StoreOnboardingInformationDraft)
    contact_channels: list[StoreOnboardingContactChannelDraft] = Field(default_factory=list)
    first_product: StoreOnboardingFirstProductDraft = Field(default_factory=StoreOnboardingFirstProductDraft)


class StoreOnboardingStateResponse(BaseModel):
    status: StoreOnboardingStatus = StoreOnboardingStatus.NOT_STARTED
    current_step: StoreOnboardingStep = StoreOnboardingStep.WELCOME
    completed_steps: list[StoreOnboardingStep] = Field(default_factory=list)
    drafts: StoreOnboardingDrafts = Field(default_factory=StoreOnboardingDrafts)
    started_at: datetime | None = None
    updated_at: datetime | None = None
    completed_at: datetime | None = None
    skipped_at: datetime | None = None
    first_product_id: int | None = None
    events: list[StoreOnboardingEvent] = Field(default_factory=list)


class StoreOnboardingUpdate(BaseModel):
    current_step: StoreOnboardingStep | None = None
    status: StoreOnboardingStatus | None = None
    completed_steps: list[StoreOnboardingStep] | None = None
    store_identity: StoreOnboardingIdentityDraft | None = None
    store_information: StoreOnboardingInformationDraft | None = None
    contact_channels: list[StoreOnboardingContactChannelDraft] | None = None
    first_product: StoreOnboardingFirstProductDraft | None = None
    first_product_id: int | None = None


class SellerOnboardingResponse(BaseModel):
    store: StoreResponse
    state: StoreOnboardingStateResponse
    categories: list[PublicHomepageCategory] = Field(default_factory=list)

