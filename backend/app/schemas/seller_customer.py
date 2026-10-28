from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OrderStatus
from app.schemas.customer_tag import CustomerTagResponse


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
    total_spent: str = "0"
    is_repeat: bool = False
    last_order_at: datetime | None = None
    has_conversation: bool = False
    conversation_id: int | None = None
    tags: list[CustomerTagResponse] = Field(default_factory=list)


class SellerCustomerDetail(SellerCustomerListItem):
    postal_code: str | None = None
    last_address: str | None = None
    orders: list[SellerCustomerOrderItem] = Field(default_factory=list)
