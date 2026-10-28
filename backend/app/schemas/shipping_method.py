from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ShippingMethodCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    cost: Decimal = Field(default=Decimal("0"), ge=0)
    eta_label: str | None = Field(default=None, max_length=100)
    is_active: bool = True
    sort_order: int = 0


class ShippingMethodUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    cost: Decimal | None = Field(default=None, ge=0)
    eta_label: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
    sort_order: int | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "ShippingMethodUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class ShippingMethodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    name: str
    cost: Decimal
    eta_label: str | None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class PublicShippingMethod(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cost: Decimal
    eta_label: str | None = None
