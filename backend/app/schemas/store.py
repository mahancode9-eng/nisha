from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StoreSocialLinkInput(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=500)
    icon_key: str | None = Field(default=None, max_length=100)
    sort_order: int = 0
    is_active: bool = True


class StoreSocialLinkResponse(StoreSocialLinkInput):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    created_at: datetime
    updated_at: datetime


class StoreSocialLinkReorderRequest(BaseModel):
    ordered_ids: list[int] = Field(min_length=1)


class StoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    cover_image_url: str | None
    category_slug: str | None
    category_name: str | None
    location: str | None
    phone: str | None
    telegram: str | None
    whatsapp: str | None
    instagram: str | None
    bale: str | None
    website: str | None
    support_contact: str | None
    trust_badges: list[str] = Field(default_factory=list, validation_alias="badge_labels")
    is_active: bool
    social_links: list[StoreSocialLinkResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class StoreUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    logo_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)
    category_slug: str | None = Field(default=None, max_length=100)
    category_name: str | None = Field(default=None, max_length=255)
    location: str | None = None
    phone: str | None = Field(default=None, max_length=50)
    telegram: str | None = Field(default=None, max_length=255)
    whatsapp: str | None = Field(default=None, max_length=255)
    instagram: str | None = Field(default=None, max_length=255)
    bale: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=500)
    support_contact: str | None = Field(default=None, max_length=255)
    social_links: list[StoreSocialLinkInput] | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "StoreUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self
