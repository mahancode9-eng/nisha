from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.db.session import get_db
from app.schemas.auth import (
    ResendVerificationRequest,
    ResendVerificationResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.services.auth_service import AuthError
from app.services.email_verification_service import resend_verification, verify_email_token

router = APIRouter(tags=["verify-email"])


@router.post("/verify-email", response_model=VerifyEmailResponse)
@limiter.limit("10/minute")
def verify_email(
    request: Request,
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> VerifyEmailResponse:
    try:
        verify_email_token(db, token=payload.token, kind=payload.kind)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return VerifyEmailResponse()


@router.post("/verify-email/resend", response_model=ResendVerificationResponse)
@limiter.limit("5/minute")
def resend_verify_email(
    request: Request,
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> ResendVerificationResponse:
    try:
        resend_verification(db, email=str(payload.email), kind=payload.kind)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return ResendVerificationResponse()
