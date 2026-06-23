from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.customer_auth import (
    CustomerLoginRequest,
    CustomerRegisterRequest,
    CustomerResponse,
    CustomerTokenResponse,
)
from app.services.auth_service import AuthError
from app.services.customer_auth_service import authenticate_customer, register_customer

router = APIRouter(tags=["customer-auth"])


def _build_token_response(customer: CustomerAccount) -> CustomerTokenResponse:
    token = create_access_token(user_id=customer.id, role="CUSTOMER")
    return CustomerTokenResponse(
        access_token=token,
        customer=CustomerResponse.model_validate(customer),
    )


@router.post("/register", response_model=CustomerTokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: CustomerRegisterRequest,
    db: Session = Depends(get_db),
) -> CustomerTokenResponse:
    try:
        customer = register_customer(
            db,
            email=str(payload.email) if payload.email else None,
            phone=payload.phone,
            postal_code=payload.postal_code,
            password=payload.password,
            full_name=payload.full_name,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(customer)


@router.post("/login", response_model=CustomerTokenResponse)
def login(
    payload: CustomerLoginRequest,
    db: Session = Depends(get_db),
) -> CustomerTokenResponse:
    try:
        customer = authenticate_customer(
            db,
            login=payload.login,
            password=payload.password,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return _build_token_response(customer)


@router.get("/me", response_model=CustomerResponse)
def me(customer: CustomerAccount = Depends(get_current_customer)) -> CustomerResponse:
    return CustomerResponse.model_validate(customer)
