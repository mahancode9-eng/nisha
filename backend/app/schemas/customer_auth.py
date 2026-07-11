from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class CustomerRegisterRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    postal_code: str | None = Field(default=None, max_length=50)
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)

    @model_validator(mode="after")
    def require_email_or_phone(self) -> "CustomerRegisterRequest":
        if not self.email and not self.phone:
            raise ValueError("At least one of email or phone is required")
        return self


class CustomerLoginRequest(BaseModel):
    login: str = Field(min_length=1, description="Email or phone")
    password: str


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str | None
    phone: str | None
    postal_code: str | None
    full_name: str


class CustomerTokenResponse(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    customer: CustomerResponse | None = None
    needs_email_verification: bool = False
    email: str | None = None
