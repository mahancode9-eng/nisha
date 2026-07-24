from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ComplaintStatus


class AdminComplaintListItem(BaseModel):
    id: int
    order_id: int
    invoice_code: str
    buyer_name: str
    store_id: int
    store_name: str
    store_slug: str
    reason: str
    message: str
    status: ComplaintStatus
    last_admin_note: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminComplaintUpdateRequest(BaseModel):
    status: ComplaintStatus
    note: Optional[str] = Field(default=None, max_length=1000)
