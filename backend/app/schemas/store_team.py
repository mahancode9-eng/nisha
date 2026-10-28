from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StoreMemberCreate(BaseModel):
    email: EmailStr
    role: str = Field(default="STAFF", max_length=20)


class StoreMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    email: str
    user_id: int | None
    role: str
    accepted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class StoreActionLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    actor_user_id: int | None
    action: str
    entity_type: str | None
    entity_id: int | None
    note: str | None
    created_at: datetime


class CustomDomainUpdate(BaseModel):
    custom_domain: str | None = Field(default=None, max_length=255)
