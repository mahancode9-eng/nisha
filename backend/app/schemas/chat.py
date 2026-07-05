from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import OrderStatus, SenderType


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    attachment_url: str | None = Field(default=None, max_length=500)
    attachment_mime_type: str | None = Field(default=None, max_length=100)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_type: SenderType
    sender_user_id: int | None
    body: str
    attachment_url: str | None
    attachment_mime_type: str | None
    is_read: bool
    created_at: datetime


class ConversationCreate(BaseModel):
    store_id: int | None = None
    order_id: int | None = None

    @model_validator(mode="after")
    def require_context(self) -> "ConversationCreate":
        if self.store_id is None and self.order_id is None:
            raise ValueError("store_id or order_id is required")
        return self


class ConversationListItem(BaseModel):
    id: int
    store_id: int
    store_name: str
    store_slug: str
    customer_id: int | None
    customer_name: str
    order_id: int | None
    invoice_code: str | None
    order_status: OrderStatus | None = None
    unread_count: int
    last_message_body: str | None
    last_message_at: datetime | None
    updated_at: datetime


class ConversationListResponse(BaseModel):
    items: list[ConversationListItem]
    total: int
    page: int
    page_size: int


class ConversationDetailResponse(BaseModel):
    id: int
    store_id: int
    store_name: str
    store_slug: str
    customer_id: int | None
    customer_name: str
    order_id: int | None
    invoice_code: str | None
    order_status: OrderStatus | None = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]
