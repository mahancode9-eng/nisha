from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OrderStatus, PaymentMethodType, ReviewStatus
from app.schemas.product import ProductFormFieldResponse, ProductImageResponse


class PublicStoreProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    cover_image_url: str | None
    category_slug: str | None
    category_name: str | None
    location: str | None
    phone: str | None
    telegram: str | None
    whatsapp: str | None
    instagram: str | None
    bale: str | None
    website: str | None
    support_contact: str | None
    trust_badges: list[str] = Field(default_factory=list, validation_alias="badge_labels")


class PublicStoreSocialLink(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    url: str
    icon_key: str | None
    sort_order: int
    is_active: bool


class PublicProduct(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    price: Decimal
    stock_quantity: int
    images: list[ProductImageResponse]
    form_fields: list[ProductFormFieldResponse]
    image_count: int = 0


class PublicStoreReview(BaseModel):
    id: int
    order_id: int
    customer_name: str
    rating: int
    title: str | None
    comment: str | None
    image_urls: list[str] = Field(default_factory=list)
    status: ReviewStatus = ReviewStatus.APPROVED
    created_at: datetime


class PublicProductReview(PublicStoreReview):
    pass


class PublicStoreReviewSummary(BaseModel):
    average_rating: float = 0
    review_count: int = 0
    recent_reviews: list[PublicStoreReview] = Field(default_factory=list)


class PublicPaymentMethod(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: PaymentMethodType
    display_name: str
    card_number: str | None
    wallet_address: str | None
    external_url: str | None
    owner_name: str | None
    instructions: str | None


class PublicStorePageResponse(BaseModel):
    store: PublicStoreProfile
    social_links: list[PublicStoreSocialLink]
    products: list[PublicProduct]
    payment_methods: list[PublicPaymentMethod]
    review_summary: PublicStoreReviewSummary


class PublicProductDetailResponse(BaseModel):
    store: PublicStoreProfile
    product: PublicProduct
    review_summary: PublicStoreReviewSummary
    public_reviews: list[PublicProductReview] = Field(default_factory=list)


class PublicHomepageCategory(BaseModel):
    label: str
    slug: str
    query: str
    product_count: int = 0
    icon_key: str | None = None


class PublicHomepageProduct(BaseModel):
    product: PublicProduct
    store: PublicStoreProfile
    average_rating: float = 0
    review_count: int = 0


class PublicHomepageStore(BaseModel):
    store: PublicStoreProfile
    product_count: int = 0
    average_rating: float = 0
    review_count: int = 0


class PublicHomepageReview(BaseModel):
    id: int
    store_name: str
    store_slug: str
    product_title: str | None = None
    customer_name: str
    rating: int
    title: str | None = None
    comment: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    created_at: datetime


class PublicHomepageStats(BaseModel):
    total_stores: int = 0
    total_products: int = 0
    total_reviews: int = 0
    average_rating: float = 0


class PublicHomepageResponse(BaseModel):
    query: str | None = None
    hero_title: str
    hero_subtitle: str
    search_hint: str
    stats: PublicHomepageStats
    categories: list[PublicHomepageCategory] = Field(default_factory=list)
    featured_products: list[PublicHomepageProduct] = Field(default_factory=list)
    featured_stores: list[PublicHomepageStore] = Field(default_factory=list)
    recent_reviews: list[PublicHomepageReview] = Field(default_factory=list)
    trust_indicators: list[str] = Field(default_factory=list)


class OrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)
    field_values: list["OrderItemFieldValueInput"] = Field(default_factory=list)


class OrderItemFieldValueInput(BaseModel):
    field_key: str = Field(min_length=1, max_length=100)
    value: str | int | float | bool | list[str] | None = None
    file_url: str | None = Field(default=None, max_length=500)


class GuestOrderCreate(BaseModel):
    buyer_name: str = Field(min_length=1, max_length=255)
    buyer_phone: str = Field(min_length=1, max_length=50)
    buyer_address: str = Field(min_length=1)
    buyer_note: str | None = Field(default=None, max_length=1000)
    payment_method_id: int
    items: list[OrderItemInput] = Field(min_length=1)

    @model_validator(mode="after")
    def merge_duplicate_products(self) -> "GuestOrderCreate":
        seen: dict[int, int] = {}
        merged: list[OrderItemInput] = []
        for item in self.items:
            idx = seen.get(item.product_id)
            if idx is not None:
                existing = merged[idx]
                merged[idx] = OrderItemInput(
                    product_id=existing.product_id,
                    quantity=existing.quantity + item.quantity,
                    field_values=existing.field_values,
                )
            else:
                seen[item.product_id] = len(merged)
                merged.append(item)
        self.items = merged
        return self


class CheckoutOrderItemSummary(BaseModel):
    product_id: int
    product_title: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class CheckoutPaymentInstructions(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: PaymentMethodType
    display_name: str
    card_number: str | None
    wallet_address: str | None
    external_url: str | None
    owner_name: str | None
    instructions: str | None


class CheckoutResponse(BaseModel):
    invoice_code: str
    invoice_edit_password: str
    order_id: int
    status: OrderStatus
    subtotal_amount: Decimal
    total_amount: Decimal
    items: list[CheckoutOrderItemSummary]
    payment_method: CheckoutPaymentInstructions


class MediaUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    thumbnail_url: str | None = None
    mime_type: str | None = None
    width: int | None = None
    height: int | None = None
    filename: str | None = None


class OrderChatAuthRequest(BaseModel):
    invoice_code: str = Field(min_length=1)
    invoice_edit_password: str = Field(min_length=1)


class PublicOrderMessageCreateRequest(OrderChatAuthRequest):
    body: str = Field(min_length=1, max_length=4000)
    attachment_url: str | None = Field(default=None, max_length=500)
    attachment_mime_type: str | None = Field(default=None, max_length=100)


class PublicReviewCreateRequest(OrderChatAuthRequest):
    order_id: int
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=255)
    comment: str | None = None
    is_public: bool = False
    image_urls: list[str] = Field(default_factory=list)
