from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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
    telegram_chat_id: str | None = None
    bale_chat_id: str | None = None
    telegram_linked_at: datetime | None = None
    bale_linked_at: datetime | None = None
    website: str | None
    support_contact: str | None
    trust_badges: list[str] = Field(default_factory=list, validation_alias="badge_labels")
    is_active: bool
    is_published: bool = False
    guest_checkout_enabled: bool = False
    theme_preset: str | None = None
    primary_color: str | None = None
    design_style: str | None = None
    about_text: str | None = None
    shipping_policy_text: str | None = None
    default_shipping_cost: Decimal = Decimal("0")
    free_shipping_min_subtotal: Decimal | None = None
    payment_reminder_minutes: int | None = None
    sms_quota_month: str | None = None
    sms_sent_count: int = 0
    instagram_import_count: int = 0
    custom_domain: str | None = None
    custom_domain_verified_at: datetime | None = None
    custom_domain_txt_name: str | None = None
    custom_domain_txt_value: str | None = None
    custom_domain_cname_target: str | None = None
    social_links: list[StoreSocialLinkResponse] = Field(default_factory=list)
    dm_reply_templates: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _parse_dm_templates(cls, data: Any) -> Any:
        if hasattr(data, "__table__"):
            raw = getattr(data, "dm_reply_templates_json", None)
            payload = {c.name: getattr(data, c.name) for c in data.__table__.columns}
            payload["badge_labels"] = list(getattr(data, "badge_labels", []) or [])
            payload["social_links"] = list(getattr(data, "social_links", []) or [])
            payload["dm_reply_templates"] = _decode_templates(raw)
            from app.services import custom_domain_service

            payload.update(custom_domain_service.dns_instruction_fields(data))
            return payload
        if isinstance(data, dict) and "dm_reply_templates_json" in data:
            data = dict(data)
            data["dm_reply_templates"] = _decode_templates(data.get("dm_reply_templates_json"))
        return data


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
    is_published: bool | None = None
    guest_checkout_enabled: bool | None = None
    theme_preset: str | None = Field(default=None, max_length=50)
    primary_color: str | None = Field(default=None, max_length=20)
    design_style: str | None = Field(default=None, max_length=20, pattern="^(saas|classic|glass)$")
    about_text: str | None = None
    shipping_policy_text: str | None = None
    default_shipping_cost: Decimal | None = Field(default=None, ge=0)
    free_shipping_min_subtotal: Decimal | None = Field(default=None, ge=0)
    payment_reminder_minutes: int | None = Field(default=None, ge=1, le=1440)
    dm_reply_templates: list[dict[str, Any]] | None = None

    @field_validator("dm_reply_templates")
    @classmethod
    def _validate_templates(cls, value: list[dict[str, Any]] | None) -> list[dict[str, Any]] | None:
        if value is None:
            return value
        if len(value) > 20:
            raise ValueError("حداکثر ۲۰ قالب پاسخ می‌تونی داشته باشی")
        cleaned: list[dict[str, Any]] = []
        for item in value:
            title = str(item.get("title") or "").strip()[:80]
            body = str(item.get("body") or "").strip()[:1000]
            if not title or not body:
                continue
            cleaned.append({"title": title, "body": body})
        return cleaned

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "StoreUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


def _decode_templates(raw: Any) -> list[dict[str, Any]]:
    if not raw:
        return []
    import json

    try:
        data = json.loads(raw) if isinstance(raw, str) else raw
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    out: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        body = str(item.get("body") or "").strip()
        if title and body:
            out.append({"title": title, "body": body})
    return out
