from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import PaymentMethodType


class PaymentMethodCreate(BaseModel):
    type: PaymentMethodType
    display_name: str = Field(min_length=1, max_length=255)
    card_number: str | None = Field(default=None, max_length=50)
    wallet_address: str | None = Field(default=None, max_length=255)
    external_url: str | None = Field(default=None, max_length=500)
    owner_name: str | None = Field(default=None, max_length=255)
    instructions: str | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_type_fields(self) -> "PaymentMethodCreate":
        if self.type == PaymentMethodType.CARD_TO_CARD:
            if not self.card_number or not self.owner_name:
                raise ValueError("card_number and owner_name are required for CARD_TO_CARD")
            self.wallet_address = None
            self.external_url = None
        elif self.type == PaymentMethodType.CRYPTO:
            if not self.wallet_address:
                raise ValueError("wallet_address is required for CRYPTO")
            self.card_number = None
            self.owner_name = None
            self.external_url = None
        elif self.type == PaymentMethodType.EXTERNAL_GATEWAY:
            if not self.external_url:
                raise ValueError("external_url is required for EXTERNAL_GATEWAY")
            self.card_number = None
            self.wallet_address = None
            self.owner_name = None
        return self


class PaymentMethodUpdate(BaseModel):
    type: PaymentMethodType | None = None
    display_name: str | None = Field(default=None, min_length=1, max_length=255)
    card_number: str | None = Field(default=None, max_length=50)
    wallet_address: str | None = Field(default=None, max_length=255)
    external_url: str | None = Field(default=None, max_length=500)
    owner_name: str | None = Field(default=None, max_length=255)
    instructions: str | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "PaymentMethodUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class PaymentMethodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_id: int
    type: PaymentMethodType
    display_name: str
    card_number: str | None
    wallet_address: str | None
    external_url: str | None
    owner_name: str | None
    instructions: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


def validate_payment_method_fields(
    *,
    method_type: PaymentMethodType,
    card_number: str | None,
    wallet_address: str | None,
    external_url: str | None,
    owner_name: str | None,
) -> None:
    if method_type == PaymentMethodType.CARD_TO_CARD:
        if not card_number or not owner_name:
            raise ValueError("card_number and owner_name are required for CARD_TO_CARD")
    elif method_type == PaymentMethodType.CRYPTO:
        if not wallet_address:
            raise ValueError("wallet_address is required for CRYPTO")
    elif method_type == PaymentMethodType.EXTERNAL_GATEWAY:
        if not external_url:
            raise ValueError("external_url is required for EXTERNAL_GATEWAY")
