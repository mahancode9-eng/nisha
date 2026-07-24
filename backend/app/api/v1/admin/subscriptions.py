from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.enums import SubscriptionInvoiceStatus
from app.models.user import User
from app.schemas.subscription import (
    AdminAssignPlanRequest,
    AdminInvoiceActionRequest,
    AdminSubscriptionInvoiceResponse,
    SellerSubscriptionResponse,
    SubscriptionInvoiceResponse,
    SubscriptionPaymentProofResponse,
    SubscriptionPlanResponse,
    SubscriptionPlanUpdate,
)
from app.services import subscription_billing_service as billing
from app.services.entitlement_service import ensure_seller_subscription

router = APIRouter(tags=["admin-subscriptions"])


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


def _invoice_response(invoice) -> AdminSubscriptionInvoiceResponse:
    seller = invoice.seller
    return AdminSubscriptionInvoiceResponse(
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
        seller_user_id=invoice.seller_user_id,
        seller_email=seller.email if seller else None,
        seller_full_name=seller.full_name if seller else None,
    )


@router.get("/plans", response_model=list[SubscriptionPlanResponse])
def list_plans(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[SubscriptionPlanResponse]:
    return [_plan_response(p) for p in billing.list_all_plans(db)]


@router.patch("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_plan(
    plan_id: int,
    payload: SubscriptionPlanUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SubscriptionPlanResponse:
    plan = billing.update_plan(
        db,
        plan_id,
        name_fa=payload.name_fa,
        monthly_price_toman=payload.monthly_price_toman,
        quarterly_price_toman=payload.quarterly_price_toman,
        yearly_price_toman=payload.yearly_price_toman,
        is_recommended=payload.is_recommended,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
        entitlements=payload.entitlements,
    )
    return _plan_response(plan)


@router.get("/subscriptions/invoices", response_model=list[AdminSubscriptionInvoiceResponse])
def list_invoices(
    status: SubscriptionInvoiceStatus | None = Query(default=None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminSubscriptionInvoiceResponse]:
    return [_invoice_response(i) for i in billing.list_admin_invoices(db, status=status)]


@router.post(
    "/subscriptions/invoices/{invoice_id}/confirm",
    response_model=AdminSubscriptionInvoiceResponse,
)
def confirm_invoice(
    invoice_id: int,
    payload: AdminInvoiceActionRequest | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminSubscriptionInvoiceResponse:
    note = payload.admin_note if payload else None
    return _invoice_response(billing.confirm_invoice(db, invoice_id, admin_note=note))


@router.post(
    "/subscriptions/invoices/{invoice_id}/reject",
    response_model=AdminSubscriptionInvoiceResponse,
)
def reject_invoice(
    invoice_id: int,
    payload: AdminInvoiceActionRequest | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminSubscriptionInvoiceResponse:
    note = payload.admin_note if payload else None
    return _invoice_response(billing.reject_invoice(db, invoice_id, admin_note=note))


@router.post(
    "/subscriptions/sellers/{seller_user_id}/assign",
    response_model=SellerSubscriptionResponse,
)
def assign_plan(
    seller_user_id: int,
    payload: AdminAssignPlanRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SellerSubscriptionResponse:
    sub = billing.admin_assign_plan(
        db,
        seller_user_id,
        plan_code=payload.plan_code,
        period=payload.period,
        months=payload.months,
    )
    sub = ensure_seller_subscription(db, seller_user_id)
    return SellerSubscriptionResponse(
        id=sub.id,
        plan=_plan_response(sub.plan),
        status=sub.status,
        billing_period=sub.billing_period,
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
        started_at=sub.started_at,
    )
