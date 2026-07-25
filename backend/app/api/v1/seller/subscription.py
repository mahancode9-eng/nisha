from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import require_seller
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.subscription import (
    CardInstructionsResponse,
    PaymentSessionResponse,
    SellerSubscriptionDetailResponse,
    SellerSubscriptionResponse,
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionInvoiceResponse,
    SubscriptionPaymentProofResponse,
    SubscriptionPlanResponse,
)
from app.services import subscription_billing_service as billing
from app.services.payments import get_platform_card_instructions

router = APIRouter(tags=["seller-subscription"])


def _plan_response(plan) -> SubscriptionPlanResponse:
    return SubscriptionPlanResponse(
        id=plan.id,
        code=plan.code,
        name_fa=plan.name_fa,
        monthly_price_toman=plan.monthly_price_toman,
        quarterly_price_toman=plan.quarterly_price_toman,
        yearly_price_toman=plan.yearly_price_toman,
        is_recommended=plan.is_recommended,
        sort_order=plan.sort_order,
        is_active=plan.is_active,
        entitlements=plan.entitlements,
    )


def _invoice_response(invoice) -> SubscriptionInvoiceResponse:
    return SubscriptionInvoiceResponse(
        id=invoice.id,
        plan=_plan_response(invoice.plan),
        period=invoice.period,
        amount_toman=invoice.amount_toman,
        status=invoice.status,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        admin_note=invoice.admin_note,
        created_at=invoice.created_at,
        proofs=[
            SubscriptionPaymentProofResponse.model_validate(p) for p in (invoice.proofs or [])
        ],
    )


@router.get("/plans", response_model=list[SubscriptionPlanResponse])
def list_plans(
    _: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> list[SubscriptionPlanResponse]:
    return [_plan_response(p) for p in billing.list_active_plans(db)]


@router.get("/subscription", response_model=SellerSubscriptionDetailResponse)
def get_subscription(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SellerSubscriptionDetailResponse:
    detail = billing.get_seller_subscription_detail(db, current_user.id)
    sub = detail["subscription"]
    return SellerSubscriptionDetailResponse(
        subscription=SellerSubscriptionResponse(
            id=sub.id,
            plan=_plan_response(sub.plan),
            status=sub.status,
            billing_period=sub.billing_period,
            current_period_start=sub.current_period_start,
            current_period_end=sub.current_period_end,
            started_at=sub.started_at,
        ),
        effective_plan=_plan_response(detail["effective_plan"]),
        entitlements=detail["entitlements"],
        is_expired_fallback=detail["is_expired_fallback"],
    )


@router.get("/subscription/card-instructions", response_model=CardInstructionsResponse)
def get_card_instructions(
    _: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> CardInstructionsResponse:
    return CardInstructionsResponse(**get_platform_card_instructions(db))


@router.post("/subscription/checkout", response_model=SubscriptionCheckoutResponse)
def checkout_subscription(
    payload: SubscriptionCheckoutRequest,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SubscriptionCheckoutResponse:
    result = billing.checkout(
        db,
        current_user.id,
        plan_code=payload.plan_code,
        period=payload.period,
    )
    payment = result["payment"]
    cards = result["card_instructions"]
    return SubscriptionCheckoutResponse(
        invoice=_invoice_response(result["invoice"]),
        payment=PaymentSessionResponse(
            provider=payment.provider,
            mode=payment.mode,
            instructions=payment.instructions,
            redirect_url=payment.redirect_url,
            external_reference=payment.external_reference,
        ),
        card_instructions=CardInstructionsResponse(**cards),
    )


@router.get("/subscription/invoices", response_model=list[SubscriptionInvoiceResponse])
def list_invoices(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> list[SubscriptionInvoiceResponse]:
    return [_invoice_response(i) for i in billing.list_seller_invoices(db, current_user.id)]


@router.post(
    "/subscription/invoices/{invoice_id}/proof",
    response_model=SubscriptionInvoiceResponse,
)
@limiter.limit("5/minute")
async def upload_proof(
    request: Request,
    invoice_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SubscriptionInvoiceResponse:
    invoice = await billing.upload_invoice_proof(db, current_user.id, invoice_id, file)
    return _invoice_response(invoice)


@router.post(
    "/subscription/invoices/{invoice_id}/cancel",
    response_model=SubscriptionInvoiceResponse,
)
def cancel_invoice(
    invoice_id: int,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
) -> SubscriptionInvoiceResponse:
    return _invoice_response(billing.cancel_open_invoice(db, current_user.id, invoice_id))
