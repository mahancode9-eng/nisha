from datetime import datetime
from typing import Any
from decimal import Decimal

from pydantic import BaseModel, ConfigDict
from pydantic import Field
from pydantic import model_validator

from app.models.enums import OrderStatus, ReviewStatus, StoreBadgeType
from app.models.enums import CustomerReceiptStatus
from app.schemas.chat import ConversationDetailResponse, ConversationListItem, MessageResponse
from app.schemas.customer_portal import CustomerComplaintResponse, CustomerProfileResponse
from app.schemas.guest_order import OrderStatusHistoryResponse, PaymentProofResponse
from app.schemas.payment_method import PaymentMethodResponse
from app.schemas.seller_order import SellerOrderItemResponse
from app.schemas.store import StoreResponse


class AdminRecentOrderItem(BaseModel):
    id: int
    invoice_code: str
    status: OrderStatus
    total_amount: Decimal
    store_name: str
    store_slug: str
    buyer_name: str
    created_at: datetime


class AdminDashboardResponse(BaseModel):
    total_stores: int
    active_stores: int
    inactive_stores: int
    total_sellers: int
    total_products: int
    total_orders: int
    confirmed_revenue: Decimal
    pending_revenue: Decimal
    recent_orders: list[AdminRecentOrderItem]


class AdminStoreListItem(BaseModel):
    id: int
    name: str
    slug: str
    owner_email: str
    is_active: bool
    product_count: int
    order_count: int
    created_at: datetime


class AdminStoreActionResponse(BaseModel):
    message: str
    store: AdminStoreListItem


class AdminStoreBadgeResponse(BaseModel):
    badge_type: StoreBadgeType
    is_active: bool
    assigned_at: datetime | None = None
    removed_at: datetime | None = None
    assigned_by_user_id: int | None = None


class AdminStoreBadgeHistoryItem(BaseModel):
    id: int
    store_id: int
    badge_type: StoreBadgeType
    action: str
    note: str | None
    admin_user_id: int | None
    created_at: datetime


class AdminReviewListItem(BaseModel):
    id: int
    order_id: int
    store_id: int
    customer_id: int | None
    rating: int
    title: str | None
    comment: str | None
    status: ReviewStatus
    image_urls: list[str] = Field(default_factory=list)
    moderation_note: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminReviewModerationRequest(BaseModel):
    status: ReviewStatus
    moderation_note: str | None = None


class AdminAuditLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    action: str
    entity_label: str | None = None
    note: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    actor_user_id: int | None = None
    actor_name: str | None = None
    created_at: datetime


class AdminOrderFieldValueResponse(BaseModel):
    field_key: str
    field_label: str
    field_type: str
    sort_order: int
    value_text: str | None = None
    value_json: Any | None = None
    file_url: str | None = None
    field_snapshot: dict[str, Any] | None = None


class AdminOrderItemSubmissionResponse(BaseModel):
    item_id: int
    product_id: int | None
    product_title_snapshot: str
    field_values: list[AdminOrderFieldValueResponse] = Field(default_factory=list)


class AdminOrderUpdateRequest(BaseModel):
    buyer_name: str | None = Field(default=None, min_length=1, max_length=255)
    buyer_phone: str | None = Field(default=None, min_length=1, max_length=50)
    buyer_address: str | None = None
    buyer_note: str | None = Field(default=None, max_length=1000)
    status: OrderStatus | None = None
    note: str | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "AdminOrderUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class AdminChatDetailResponse(ConversationDetailResponse):
    messages: list[MessageResponse]


class AdminOrderListItem(BaseModel):
    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    buyer_phone: str
    total_amount: Decimal
    store_id: int
    store_name: str
    store_slug: str
    customer_id: int | None = None
    receipt_status: CustomerReceiptStatus | None = None
    complaint_count: int = 0
    created_at: datetime


class AdminOrderDetailResponse(BaseModel):
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
    customer: CustomerProfileResponse | None = None
    invoice_username: str
    invoice_password: str | None = None
    receipt_status: CustomerReceiptStatus | None = None
    complaint_count: int = 0
    stock_restored: bool
    store_id: int
    store_name: str
    store_slug: str
    created_at: datetime
    updated_at: datetime
    items: list[SellerOrderItemResponse]
    submissions: list[AdminOrderItemSubmissionResponse] = Field(default_factory=list)
    complaints: list[CustomerComplaintResponse] = Field(default_factory=list)
    conversation_id: int | None = None
    conversation: ConversationDetailResponse | None = None
    audit_logs: list[AdminAuditLogResponse] = Field(default_factory=list)
    payment_method: PaymentMethodResponse
    payment_proofs: list[PaymentProofResponse]
    status_history: list[OrderStatusHistoryResponse]


class AdminStoreDetailResponse(BaseModel):
    store: StoreResponse
    owner_email: str
    product_count: int
    order_count: int
    badges: list[AdminStoreBadgeResponse] = Field(default_factory=list)
    badge_history: list[AdminStoreBadgeHistoryItem] = Field(default_factory=list)
    audit_logs: list[AdminAuditLogResponse] = Field(default_factory=list)
