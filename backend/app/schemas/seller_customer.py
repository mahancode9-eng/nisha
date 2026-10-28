from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderStatus


class SellerCustomerOrderItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_code: str
    status: OrderStatus
    total_amount: str
    buyer_address: str | None = None
    created_at: datetime


class SellerCustomerListItem(BaseModel):
    key: str
    kind: Literal["account", "guest"]
    customer_id: int | None = None
    full_name: str
    phone: str | None = None
    email: str | None = None
    order_count: int = 0
    last_order_at: datetime | None = None
    has_conversation: bool = False
    conversation_id: int | None = None
    # Paid orders only (confirmed, preparing, shipped, delivered).
    paid_order_count: int = 0
    total_spent: Decimal = Decimal("0")
    # Two or more paid orders.
    is_repeat: bool = False
    tags: list[str] = Field(default_factory=list)


class CustomerTagsUpdate(BaseModel):
    tags: list[str] = Field(default_factory=list, max_length=10)


class CustomerTagsResponse(BaseModel):
    key: str
    tags: list[str]


class SellerCustomerDetail(SellerCustomerListItem):
    postal_code: str | None = None
    last_address: str | None = None
    orders: list[SellerCustomerOrderItem] = Field(default_factory=list)
