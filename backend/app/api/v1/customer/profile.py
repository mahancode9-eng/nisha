from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.customer_portal import (
    CustomerAddressCreateRequest,
    CustomerAddressResponse,
    CustomerAddressUpdateRequest,
    CustomerProfileResponse,
    CustomerProfileUpdateRequest,
)
from app.services.auth_service import AuthError
from app.services.customer_profile_service import (
    create_address,
    delete_address,
    list_addresses,
    update_address,
    update_customer_profile,
)

router = APIRouter(tags=["customer-profile"])


@router.get("/profile", response_model=CustomerProfileResponse)
def get_profile(customer: CustomerAccount = Depends(get_current_customer)) -> CustomerProfileResponse:
    return CustomerProfileResponse.model_validate(customer)


@router.patch("/profile", response_model=CustomerProfileResponse)
def patch_profile(
    payload: CustomerProfileUpdateRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerProfileResponse:
    try:
        customer = update_customer_profile(
            db,
            customer,
            email=payload.email,
            phone=payload.phone,
            postal_code=payload.postal_code,
            full_name=payload.full_name,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return CustomerProfileResponse.model_validate(customer)


@router.get("/addresses", response_model=list[CustomerAddressResponse])
def get_addresses(
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerAddressResponse]:
    return [CustomerAddressResponse.model_validate(address) for address in list_addresses(db, customer.id)]


@router.post("/addresses", response_model=CustomerAddressResponse, status_code=status.HTTP_201_CREATED)
def post_address(
    payload: CustomerAddressCreateRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    address = create_address(
        db,
        customer.id,
        label=payload.label,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        postal_code=payload.postal_code,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        province=payload.province,
        country=payload.country,
        is_default=payload.is_default,
    )
    return CustomerAddressResponse.model_validate(address)


@router.patch("/addresses/{address_id}", response_model=CustomerAddressResponse)
def patch_address(
    address_id: int,
    payload: CustomerAddressUpdateRequest,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    try:
        address = update_address(
            db,
            customer.id,
            address_id,
            label=payload.label,
            recipient_name=payload.recipient_name,
            recipient_phone=payload.recipient_phone,
            postal_code=payload.postal_code,
            address_line1=payload.address_line1,
            address_line2=payload.address_line2,
            city=payload.city,
            province=payload.province,
            country=payload.country,
            is_default=payload.is_default,
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return CustomerAddressResponse.model_validate(address)


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_address(
    address_id: int,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> None:
    try:
        delete_address(db, customer.id, address_id)
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

