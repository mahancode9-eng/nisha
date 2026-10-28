from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CustomerTagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str | None = Field(default=None, max_length=20)


class CustomerTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color: str | None = Field(default=None, max_length=20)

    @model_validator(mode="after")
    def require_field(self) -> "CustomerTagUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class CustomerTagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    name: str
    color: str | None
    created_at: datetime
    updated_at: datetime


class CustomerTagAssignRequest(BaseModel):
    tag_ids: list[int] = Field(default_factory=list, max_length=20)
