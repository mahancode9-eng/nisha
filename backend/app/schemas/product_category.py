from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProductCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    sort_order: int = 0
    is_active: bool = True


class ProductCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    sort_order: int | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "ProductCategoryUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class ProductCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    name: str
    slug: str
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductCategorySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
