from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ProductFieldType


class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    thumbnail_url: str | None
    alt_text: str | None
    sort_order: int
    mime_type: str | None
    width: int | None
    height: int | None


class ProductImageInput(BaseModel):
    image_url: str = Field(min_length=1, max_length=500)
    thumbnail_url: str | None = Field(default=None, max_length=500)
    alt_text: str | None = Field(default=None, max_length=255)
    sort_order: int = 0
    mime_type: str | None = Field(default=None, max_length=100)
    width: int | None = Field(default=None, ge=1)
    height: int | None = Field(default=None, ge=1)


class ProductImageReorderRequest(BaseModel):
    ordered_ids: list[int] = Field(min_length=1)


class ProductFieldOption(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=255)


class ProductFormFieldInput(BaseModel):
    field_key: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=255)
    field_type: ProductFieldType
    sort_order: int = 0
    is_required: bool = False
    placeholder: str | None = Field(default=None, max_length=255)
    help_text: str | None = None
    validation: dict[str, str | int | float | bool | None] | None = None
    options: list[ProductFieldOption] | None = None

    @model_validator(mode="after")
    def validate_options(self) -> "ProductFormFieldInput":
        if self.field_type in {ProductFieldType.DROPDOWN, ProductFieldType.RADIO} and not self.options:
            raise ValueError("Dropdown and radio fields require options")
        if self.field_type not in {ProductFieldType.DROPDOWN, ProductFieldType.RADIO} and self.options:
            # Keep the payload tidy; non-select inputs should not carry stale options.
            self.options = None
        return self


class ProductFormFieldResponse(ProductFormFieldInput):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime


class ProductFormFieldReorderRequest(BaseModel):
    ordered_ids: list[int] = Field(min_length=1)


class ProductCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(gt=0)
    stock_quantity: int = Field(ge=0, default=0)
    is_active: bool = True
    image_urls: list[str] | None = None
    images: list[ProductImageInput] | None = None
    form_fields: list[ProductFormFieldInput] | None = None


class ProductUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    image_urls: list[str] | None = None
    images: list[ProductImageInput] | None = None
    form_fields: list[ProductFormFieldInput] | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    title: str
    description: str | None
    price: Decimal
    stock_quantity: int
    is_active: bool
    images: list[ProductImageResponse]
    form_fields: list[ProductFormFieldResponse]
    created_at: datetime
    updated_at: datetime
