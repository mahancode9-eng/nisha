from __future__ import annotations

import calendar
from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import BillingPeriod, SellerSubscriptionStatus, SubscriptionInvoiceStatus
from app.models.subscription import (
    SellerSubscription,
    SubscriptionInvoice,
    SubscriptionPaymentProof,
    SubscriptionPlan,
)
from app.services import entitlement_service
from app.services.exceptions import ServiceError
from app.services.payments import get_payment_provider, get_platform_card_instructions
from app.utils.upload import save_uploaded_media


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _add_months(dt: datetime, months: int) -> datetime:
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _period_end(start: datetime, period: BillingPeriod) -> datetime:
    if period == BillingPeriod.YEARLY:
        return _add_months(start, 12)
    if period == BillingPeriod.QUARTERLY:
        return _add_months(start, 3)
    return _add_months(start, 1)


def list_active_plans(db: Session) -> list[SubscriptionPlan]:
    entitlement_service.ensure_plans_seeded(db)
    return list(
        db.scalars(
            select(SubscriptionPlan)
            .where(SubscriptionPlan.is_active.is_(True))
            .order_by(SubscriptionPlan.sort_order, SubscriptionPlan.id)
        ).all()
    )


def list_all_plans(db: Session) -> list[SubscriptionPlan]:
    entitlement_service.ensure_plans_seeded(db)
    return list(
        db.scalars(
            select(SubscriptionPlan).order_by(SubscriptionPlan.sort_order, SubscriptionPlan.id)
        ).all()
    )


def get_plan(db: Session, plan_id: int) -> SubscriptionPlan:
    plan = db.get(SubscriptionPlan, plan_id)
    if plan is None:
        raise ServiceError("پلن پیدا نشد", status_code=404)
    return plan


def update_plan(
    db: Session,
    plan_id: int,
    *,
    name_fa: str | None = None,
    monthly_price_toman: int | None = None,
    quarterly_price_toman: int | None = None,
    yearly_price_toman: int | None = None,
    is_recommended: bool | None = None,
    sort_order: int | None = None,
    is_active: bool | None = None,
    entitlements: dict | None = None,
) -> SubscriptionPlan:
    plan = get_plan(db, plan_id)
    if name_fa is not None:
        plan.name_fa = name_fa
    if monthly_price_toman is not None:
        plan.monthly_price_toman = monthly_price_toman
    if quarterly_price_toman is not None:
        plan.quarterly_price_toman = quarterly_price_toman
    if yearly_price_toman is not None:
        plan.yearly_price_toman = yearly_price_toman
    if is_recommended is not None:
        if is_recommended:
            for other in db.scalars(select(SubscriptionPlan)).all():
                other.is_recommended = other.id == plan.id
        else:
            plan.is_recommended = False
    if sort_order is not None:
        plan.sort_order = sort_order
    if is_active is not None:
        if plan.code == entitlement_service.PLAN_FREE and not is_active:
            raise ServiceError("پلن رایگان را نمی‌توان غیرفعال کرد", status_code=400)
        plan.is_active = is_active
    if entitlements is not None:
        plan.set_entitlements(entitlements)
    db.commit()
    db.refresh(plan)
    return plan


def get_seller_subscription_detail(db: Session, seller_user_id: int) -> dict:
    sub = entitlement_service.ensure_seller_subscription(db, seller_user_id)
    effective = entitlement_service.resolve_effective_plan(db, seller_user_id)
    entitlements = entitlement_service.get_seller_entitlements(db, seller_user_id)
    return {
        "subscription": sub,
        "effective_plan": effective,
        "entitlements": entitlements,
        "is_expired_fallback": effective.id != sub.plan_id,
    }


def _amount_for_period(plan: SubscriptionPlan, period: BillingPeriod) -> int:
    if plan.code == entitlement_service.PLAN_FREE:
        raise ServiceError("پلن رایگان نیاز به پرداخت ندارد", status_code=400)
    if period == BillingPeriod.YEARLY:
        return plan.yearly_price_toman
    if period == BillingPeriod.QUARTERLY:
        return plan.quarterly_price_toman
    return plan.monthly_price_toman


def checkout(
    db: Session,
    seller_user_id: int,
    *,
    plan_code: str,
    period: BillingPeriod,
) -> dict:
    entitlement_service.ensure_plans_seeded(db)
    plan = entitlement_service.get_plan_by_code(db, plan_code)
    if not plan.is_active:
        raise ServiceError("این پلن فعال نیست", status_code=400)
    if plan.code == entitlement_service.PLAN_FREE:
        raise ServiceError("برای بازگشت به پلن رایگان نیازی به پرداخت نیست", status_code=400)

    open_invoice = db.scalar(
        select(SubscriptionInvoice)
        .where(
            SubscriptionInvoice.seller_user_id == seller_user_id,
            SubscriptionInvoice.status.in_(
                [
                    SubscriptionInvoiceStatus.PENDING_PAYMENT,
                    SubscriptionInvoiceStatus.PROOF_UPLOADED,
                ]
            ),
        )
        .order_by(SubscriptionInvoice.id.desc())
    )
    if open_invoice is not None:
        raise ServiceError(
            "یک فاکتور باز دارید. ابتدا آن را تکمیل یا لغو کنید.",
            status_code=409,
        )

    amount = _amount_for_period(plan, period)
    invoice = SubscriptionInvoice(
        seller_user_id=seller_user_id,
        plan_id=plan.id,
        period=period,
        amount_toman=amount,
        status=SubscriptionInvoiceStatus.PENDING_PAYMENT,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    provider = get_payment_provider()
    session = provider.create_payment(db, invoice)
    invoice = db.scalar(
        select(SubscriptionInvoice)
        .options(
            selectinload(SubscriptionInvoice.plan),
            selectinload(SubscriptionInvoice.proofs),
        )
        .where(SubscriptionInvoice.id == invoice.id)
    )
    assert invoice is not None
    return {
        "invoice": invoice,
        "payment": session,
        "card_instructions": get_platform_card_instructions(db),
    }


def list_seller_invoices(db: Session, seller_user_id: int) -> list[SubscriptionInvoice]:
    return list(
        db.scalars(
            select(SubscriptionInvoice)
            .options(
                selectinload(SubscriptionInvoice.plan),
                selectinload(SubscriptionInvoice.proofs),
            )
            .where(SubscriptionInvoice.seller_user_id == seller_user_id)
            .order_by(SubscriptionInvoice.id.desc())
        ).all()
    )


def get_seller_invoice(db: Session, seller_user_id: int, invoice_id: int) -> SubscriptionInvoice:
    invoice = db.scalar(
        select(SubscriptionInvoice)
        .options(
            selectinload(SubscriptionInvoice.plan),
            selectinload(SubscriptionInvoice.proofs),
        )
        .where(
            SubscriptionInvoice.id == invoice_id,
            SubscriptionInvoice.seller_user_id == seller_user_id,
        )
    )
    if invoice is None:
        raise ServiceError("فاکتور پیدا نشد", status_code=404)
    return invoice


async def upload_invoice_proof(
    db: Session,
    seller_user_id: int,
    invoice_id: int,
    file: UploadFile,
) -> SubscriptionInvoice:
    invoice = get_seller_invoice(db, seller_user_id, invoice_id)
    if invoice.status not in {
        SubscriptionInvoiceStatus.PENDING_PAYMENT,
        SubscriptionInvoiceStatus.PROOF_UPLOADED,
    }:
        raise ServiceError("امکان بارگذاری رسید برای این فاکتور وجود ندارد", status_code=400)

    media = await save_uploaded_media(
        file,
        subdir=settings.SUBSCRIPTION_PROOF_SUBDIR,
        image_only=True,
    )
    proof = SubscriptionPaymentProof(
        invoice_id=invoice.id,
        image_url=media.url,
        uploaded_at=_now(),
    )
    db.add(proof)
    invoice.status = SubscriptionInvoiceStatus.PROOF_UPLOADED
    db.commit()
    return get_seller_invoice(db, seller_user_id, invoice_id)


def cancel_open_invoice(db: Session, seller_user_id: int, invoice_id: int) -> SubscriptionInvoice:
    invoice = get_seller_invoice(db, seller_user_id, invoice_id)
    if invoice.status not in {
        SubscriptionInvoiceStatus.PENDING_PAYMENT,
        SubscriptionInvoiceStatus.PROOF_UPLOADED,
    }:
        raise ServiceError("این فاکتور قابل لغو نیست", status_code=400)
    invoice.status = SubscriptionInvoiceStatus.CANCELLED
    db.commit()
    return get_seller_invoice(db, seller_user_id, invoice_id)


def list_admin_invoices(
    db: Session,
    *,
    status: SubscriptionInvoiceStatus | None = None,
) -> list[SubscriptionInvoice]:
    stmt = (
        select(SubscriptionInvoice)
        .options(
            selectinload(SubscriptionInvoice.plan),
            selectinload(SubscriptionInvoice.proofs),
            selectinload(SubscriptionInvoice.seller),
        )
        .order_by(SubscriptionInvoice.id.desc())
    )
    if status is not None:
        stmt = stmt.where(SubscriptionInvoice.status == status)
    return list(db.scalars(stmt).all())


def get_admin_invoice(db: Session, invoice_id: int) -> SubscriptionInvoice:
    invoice = db.scalar(
        select(SubscriptionInvoice)
        .options(
            selectinload(SubscriptionInvoice.plan),
            selectinload(SubscriptionInvoice.proofs),
            selectinload(SubscriptionInvoice.seller),
        )
        .where(SubscriptionInvoice.id == invoice_id)
    )
    if invoice is None:
        raise ServiceError("فاکتور پیدا نشد", status_code=404)
    return invoice


def confirm_invoice(db: Session, invoice_id: int, *, admin_note: str | None = None) -> SubscriptionInvoice:
    invoice = get_admin_invoice(db, invoice_id)
    if invoice.status not in {
        SubscriptionInvoiceStatus.PENDING_PAYMENT,
        SubscriptionInvoiceStatus.PROOF_UPLOADED,
    }:
        raise ServiceError("این فاکتور قابل تایید نیست", status_code=400)

    now = _now()
    sub = entitlement_service.ensure_seller_subscription(db, invoice.seller_user_id)
    base = now
    if (
        sub.current_period_end is not None
        and sub.status == SellerSubscriptionStatus.ACTIVE
        and sub.current_period_end > now
    ):
        base = sub.current_period_end
        if base.tzinfo is None:
            base = base.replace(tzinfo=timezone.utc)

    period_end = _period_end(base, invoice.period)
    invoice.period_start = base
    invoice.period_end = period_end
    invoice.status = SubscriptionInvoiceStatus.PAID
    if admin_note:
        invoice.admin_note = admin_note

    sub.plan_id = invoice.plan_id
    sub.status = SellerSubscriptionStatus.ACTIVE
    sub.billing_period = invoice.period
    sub.current_period_start = base
    sub.current_period_end = period_end
    db.commit()
    return get_admin_invoice(db, invoice_id)


def reject_invoice(db: Session, invoice_id: int, *, admin_note: str | None = None) -> SubscriptionInvoice:
    invoice = get_admin_invoice(db, invoice_id)
    if invoice.status not in {
        SubscriptionInvoiceStatus.PENDING_PAYMENT,
        SubscriptionInvoiceStatus.PROOF_UPLOADED,
    }:
        raise ServiceError("این فاکتور قابل رد نیست", status_code=400)
    invoice.status = SubscriptionInvoiceStatus.REJECTED
    if admin_note:
        invoice.admin_note = admin_note
    db.commit()
    return get_admin_invoice(db, invoice_id)


def admin_assign_plan(
    db: Session,
    seller_user_id: int,
    *,
    plan_code: str,
    period: BillingPeriod = BillingPeriod.MONTHLY,
    months: int = 1,
) -> SellerSubscription:
    plan = entitlement_service.get_plan_by_code(db, plan_code)
    sub = entitlement_service.ensure_seller_subscription(db, seller_user_id)
    now = _now()
    sub.plan_id = plan.id
    sub.status = SellerSubscriptionStatus.ACTIVE
    sub.billing_period = period
    sub.current_period_start = now
    if plan.code == entitlement_service.PLAN_FREE:
        sub.current_period_end = None
    elif period == BillingPeriod.YEARLY:
        sub.current_period_end = _period_end(now, BillingPeriod.YEARLY)
    elif period == BillingPeriod.QUARTERLY:
        sub.current_period_end = _period_end(now, BillingPeriod.QUARTERLY)
    else:
        end = now
        for _ in range(max(months, 1)):
            end = _period_end(end, BillingPeriod.MONTHLY)
        sub.current_period_end = end
    db.commit()
    return entitlement_service.ensure_seller_subscription(db, seller_user_id)
