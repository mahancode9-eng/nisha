from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ProductFieldType
from app.schemas.product_category import ProductCategorySummary

MAX_PRODUCT_IMAGES = 8


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


class ProductVariantInput(BaseModel):
    """Seller-facing input for a product variant (roadmap task 16)."""

    name: str = Field(min_length=1, max_length=255)
    price_override: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    sort_order: int = 0
    is_active: bool = True


class ProductVariantResponse(ProductVariantInput):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime


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
    video_url: str | None = Field(default=None, max_length=500)
    video_mime_type: str | None = Field(default=None, max_length=100)
    image_urls: list[str] | None = Field(default=None, max_length=MAX_PRODUCT_IMAGES)
    images: list[ProductImageInput] | None = Field(default=None, max_length=MAX_PRODUCT_IMAGES)
    form_fields: list[ProductFormFieldInput] | None = None
    variants: list[ProductVariantInput] | None = None
    category_id: int | None = None
    shipping_cost: Decimal | None = Field(default=None, ge=0)


class ProductUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
    video_url: str | None = Field(default=None, max_length=500)
    video_mime_type: str | None = Field(default=None, max_length=100)
    image_urls: list[str] | None = Field(default=None, max_length=MAX_PRODUCT_IMAGES)
    images: list[ProductImageInput] | None = Field(default=None, max_length=MAX_PRODUCT_IMAGES)
    form_fields: list[ProductFormFieldInput] | None = None
    variants: list[ProductVariantInput] | None = None
    category_id: int | None = None
    shipping_cost: Decimal | None = Field(default=None, ge=0)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    title: str
    description: str | None
    price: Decimal
    stock_quantity: int
    is_active: bool
    video_url: str | None
    video_mime_type: str | None
    images: list[ProductImageResponse]
    form_fields: list[ProductFormFieldResponse]
    variants: list[ProductVariantResponse] = Field(default_factory=list)
    category_id: int | None = None
    category: ProductCategorySummary | None = None
    shipping_cost: Decimal | None = None
    created_at: datetime
    updated_at: datetime
