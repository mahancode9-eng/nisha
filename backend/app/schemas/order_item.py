from typing import Any

from pydantic import BaseModel, Field


class OrderItemFieldValueResponse(BaseModel):
    field_key: str
    field_label: str
    field_type: str
    sort_order: int
    value_text: str | None = None
    value_json: Any | None = None
    file_url: str | None = None
    field_snapshot: dict[str, Any] | None = None
