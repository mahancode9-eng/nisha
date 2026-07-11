from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    store_slug: str | None = None


class TokenResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: UserResponse | None = None
    needs_email_verification: bool = False
    email: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class UserRecoveryRequest(BaseModel):
    email: EmailStr


class UserRecoveryStartResponse(BaseModel):
    recovery_id: int
    expires_at: datetime
    delivery_hint: str | None = None
    debug_code: str | None = None


class UserRecoveryVerifyRequest(BaseModel):
    recovery_id: int
    code: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=8)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=16)
    kind: str = Field(description="customer or seller")


class VerifyEmailResponse(BaseModel):
    verified: bool = True


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    kind: str = Field(description="customer or seller")


class ResendVerificationResponse(BaseModel):
    sent: bool = True
