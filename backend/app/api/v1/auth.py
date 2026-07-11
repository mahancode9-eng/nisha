from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserRecoveryRequest,
    UserRecoveryStartResponse,
    UserRecoveryVerifyRequest,
    UserResponse,
)
from app.schemas.user_mapper import user_to_response
from app.services.auth_service import AuthError, authenticate_user, register_seller, user_needs_email_verification
from app.services.user_recovery_service import (
    build_recovery_hint,
    request_password_recovery,
    verify_password_recovery,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    if user_needs_email_verification(user):
        return TokenResponse(
            needs_email_verification=True,
            email=user.email,
        )
    token = create_access_token(user_id=user.id, role=user.role.value)
    refresh_token = create_refresh_token(user_id=user.id, role=user.role.value)
    return TokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        user=user_to_response(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(
    request: Request,
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    try:
        user = register_seller(
            db,
            email=str(payload.email),
            password=payload.password,
            full_name=payload.full_name,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    try:
        user = authenticate_user(
            db,
            email=str(payload.email),
            password=payload.password,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        token_payload = decode_refresh_token(payload.refresh_token)
        user_id = int(token_payload.get("sub", ""))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = db.scalar(
        select(User)
        .options(selectinload(User.store))
        .where(User.id == user_id)
    )
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return user_to_response(current_user)


@router.post("/password-recovery/request", response_model=UserRecoveryStartResponse)
@limiter.limit("5/minute")
def request_recovery(
    request: Request,
    payload: UserRecoveryRequest,
    db: Session = Depends(get_db),
) -> UserRecoveryStartResponse:
    from app.core.config import settings

    try:
        recovery, code = request_password_recovery(db, email=str(payload.email))
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return UserRecoveryStartResponse(
        recovery_id=recovery.id,
        expires_at=recovery.expires_at,
        delivery_hint=build_recovery_hint(recovery.email),
        debug_code=code if settings.ENVIRONMENT == "development" else None,
    )


@router.post("/password-recovery/verify", response_model=TokenResponse)
@limiter.limit("5/minute")
def verify_recovery(
    request: Request,
    payload: UserRecoveryVerifyRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    try:
        user = verify_password_recovery(
            db,
            recovery_id=payload.recovery_id,
            code=payload.code,
            new_password=payload.new_password,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(user)
