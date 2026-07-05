from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.customer_portal import CustomerCheckoutCreate
from app.schemas.public import CheckoutResponse
from app.services import checkout_service
from app.services.customer_profile_service import create_address
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/stores", tags=["customer-checkout"])


@router.post(
    "/{slug}/orders",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_order(
    slug: str,
    payload: CustomerCheckoutCreate,
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CheckoutResponse:
    try:
        order = checkout_service.create_guest_order(
            db,
            slug,
            payload,
            customer_id=customer.id,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    if payload.save_address:
        try:
            create_address(
                db,
                customer.id,
                label=payload.address_label,
                recipient_name=payload.buyer_name,
                recipient_phone=payload.buyer_phone,
                postal_code=payload.postal_code,
                address_line1=payload.buyer_address,
                address_line2=payload.address_line2,
                city=payload.city,
                province=payload.province,
                country=payload.country,
                is_default=False,
            )
        except ServiceError:
            pass
    return order
