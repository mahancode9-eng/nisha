from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.customer_auth import CustomerResponse
from app.schemas.customer_portal import (
    CustomerRecoveryRequest,
    CustomerRecoveryStartResponse,
    CustomerRecoveryVerifyRequest,
    CustomerRecoveryVerifyResponse,
)
from app.services.auth_service import AuthError
from app.services.customer_recovery_service import (
    build_recovery_hint,
    request_password_recovery,
    verify_password_recovery,
)

router = APIRouter(tags=["customer-recovery"])


@router.post("/password-recovery/request", response_model=CustomerRecoveryStartResponse)
def request_recovery(
    payload: CustomerRecoveryRequest,
    db: Session = Depends(get_db),
) -> CustomerRecoveryStartResponse:
    try:
        recovery, code = request_password_recovery(
            db,
            login=payload.login,
            channel=payload.channel,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return CustomerRecoveryStartResponse(
        recovery_id=recovery.id,
        channel=recovery.channel,
        expires_at=recovery.expires_at,
        delivery_hint=build_recovery_hint(recovery.login_identifier),
        debug_code=code if settings.ENVIRONMENT == "development" else None,
    )


@router.post("/password-recovery/verify", response_model=CustomerRecoveryVerifyResponse)
def verify_recovery(
    payload: CustomerRecoveryVerifyRequest,
    db: Session = Depends(get_db),
) -> CustomerRecoveryVerifyResponse:
    try:
        customer = verify_password_recovery(
            db,
            recovery_id=payload.recovery_id,
            code=payload.code,
            new_password=payload.new_password,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    token = create_access_token(user_id=customer.id, role="CUSTOMER")
    return CustomerRecoveryVerifyResponse(
        access_token=token,
        customer=CustomerResponse.model_validate(customer),
    )

