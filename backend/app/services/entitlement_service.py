from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import BillingPeriod, SellerSubscriptionStatus
from app.models.subscription import SellerSubscription, SubscriptionPlan
from app.services.exceptions import ServiceError

PLAN_FREE = "free"
PLAN_BASIC = "basic"
PLAN_PRO = "pro"
PLAN_ENTERPRISE = "enterprise"

DEFAULT_ENTITLEMENTS: dict[str, Any] = {
    "max_products": 30,
    "max_product_images": 3,
    "product_video": False,
    "custom_fields": False,
    "discounts": False,
    "analytics_max_days": 7,
    "guest_checkout": False,
    "badge_trust": False,
    "badge_premium": False,
    "store_theme": False,
    "excel_export": False,
    "store_pages": False,
    "priority_support": False,
}

PLAN_SEEDS: list[dict[str, Any]] = [
    {
        "code": PLAN_FREE,
        "name_fa": "رایگان",
        "monthly_price_toman": 0,
        "quarterly_price_toman": 0,
        "yearly_price_toman": 0,
        "is_recommended": False,
        "sort_order": 1,
        "entitlements": {
            **DEFAULT_ENTITLEMENTS,
        },
    },
    {
        "code": PLAN_BASIC,
        "name_fa": "پایه",
        "monthly_price_toman": 299_000,
        "quarterly_price_toman": 807_000,
        "yearly_price_toman": 2_990_000,
        "is_recommended": False,
        "sort_order": 2,
        "entitlements": {
            **DEFAULT_ENTITLEMENTS,
            "max_products": 200,
            "max_product_images": 8,
            "custom_fields": True,
            "discounts": True,
            "analytics_max_days": 30,
            "guest_checkout": True,
        },
    },
    {
        "code": PLAN_PRO,
        "name_fa": "حرفه‌ای",
        "monthly_price_toman": 599_000,
        "quarterly_price_toman": 1_617_000,
        "yearly_price_toman": 5_990_000,
        "is_recommended": True,
        "sort_order": 3,
        "entitlements": {
            **DEFAULT_ENTITLEMENTS,
            "max_products": None,
            "max_product_images": 8,
            "product_video": True,
            "custom_fields": True,
            "discounts": True,
            "analytics_max_days": 90,
            "guest_checkout": True,
            "badge_trust": True,
            "store_theme": True,
            "excel_export": True,
            "store_pages": True,
        },
    },
    {
        "code": PLAN_ENTERPRISE,
        "name_fa": "سازمانی",
        "monthly_price_toman": 1_290_000,
        "quarterly_price_toman": 3_483_000,
        "yearly_price_toman": 12_900_000,
        "is_recommended": False,
        "sort_order": 4,
        "entitlements": {
            **DEFAULT_ENTITLEMENTS,
            "max_products": None,
            "max_product_images": 8,
            "product_video": True,
            "custom_fields": True,
            "discounts": True,
            "analytics_max_days": 90,
            "guest_checkout": True,
            "badge_trust": True,
            "badge_premium": True,
            "store_theme": True,
            "excel_export": True,
            "store_pages": True,
            "priority_support": True,
        },
    },
]


def ensure_plans_seeded(db: Session) -> None:
    existing = {p.code: p for p in db.scalars(select(SubscriptionPlan)).all()}
    created = False
    for seed in PLAN_SEEDS:
        plan = existing.get(seed["code"])
        if plan is None:
            plan = SubscriptionPlan(
                code=seed["code"],
                name_fa=seed["name_fa"],
                monthly_price_toman=seed["monthly_price_toman"],
                quarterly_price_toman=seed["quarterly_price_toman"],
                yearly_price_toman=seed["yearly_price_toman"],
                is_recommended=seed["is_recommended"],
                sort_order=seed["sort_order"],
                is_active=True,
            )
            plan.set_entitlements(seed["entitlements"])
            db.add(plan)
            created = True
        elif getattr(plan, "quarterly_price_toman", None) in (None, 0) and seed["quarterly_price_toman"]:
            plan.quarterly_price_toman = seed["quarterly_price_toman"]
            created = True
    if created:
        db.commit()


def get_plan_by_code(db: Session, code: str) -> SubscriptionPlan:
    ensure_plans_seeded(db)
    plan = db.scalar(select(SubscriptionPlan).where(SubscriptionPlan.code == code))
    if plan is None:
        raise ServiceError("پلن پیدا نشد", status_code=404)
    return plan


def get_free_plan(db: Session) -> SubscriptionPlan:
    return get_plan_by_code(db, PLAN_FREE)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_seller_subscription(db: Session, seller_user_id: int) -> SellerSubscription:
    ensure_plans_seeded(db)
    sub = db.scalar(
        select(SellerSubscription)
        .options(selectinload(SellerSubscription.plan))
        .where(SellerSubscription.seller_user_id == seller_user_id)
    )
    if sub is not None:
        return sub

    free = get_free_plan(db)
    now = _now()
    sub = SellerSubscription(
        seller_user_id=seller_user_id,
        plan_id=free.id,
        status=SellerSubscriptionStatus.ACTIVE,
        billing_period=BillingPeriod.MONTHLY,
        current_period_start=now,
        current_period_end=None,
        started_at=now,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    sub = db.scalar(
        select(SellerSubscription)
        .options(selectinload(SellerSubscription.plan))
        .where(SellerSubscription.id == sub.id)
    )
    assert sub is not None
    return sub


def _is_period_valid(sub: SellerSubscription) -> bool:
    if sub.plan.code == PLAN_FREE:
        return True
    if sub.status != SellerSubscriptionStatus.ACTIVE:
        return False
    if sub.current_period_end is None:
        return True
    end = sub.current_period_end
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return end >= _now()


def resolve_effective_plan(db: Session, seller_user_id: int) -> SubscriptionPlan:
    sub = ensure_seller_subscription(db, seller_user_id)
    if _is_period_valid(sub):
        return sub.plan
    return get_free_plan(db)


def get_seller_entitlements(db: Session, seller_user_id: int) -> dict[str, Any]:
    plan = resolve_effective_plan(db, seller_user_id)
    merged = deepcopy(DEFAULT_ENTITLEMENTS)
    merged.update(plan.entitlements or {})
    return merged


def require_entitlement(db: Session, seller_user_id: int, key: str, *, message: str | None = None) -> dict[str, Any]:
    entitlements = get_seller_entitlements(db, seller_user_id)
    if not entitlements.get(key):
        raise ServiceError(
            message or "این قابلیت در پلن فعلی شما فعال نیست. لطفاً پلن خود را ارتقا دهید.",
            status_code=403,
        )
    return entitlements


def get_max_products(entitlements: dict[str, Any]) -> int | None:
    value = entitlements.get("max_products")
    if value is None:
        return None
    return int(value)


def get_max_product_images(entitlements: dict[str, Any]) -> int:
    return int(entitlements.get("max_product_images") or 3)


def get_analytics_max_days(entitlements: dict[str, Any]) -> int:
    return int(entitlements.get("analytics_max_days") or 7)
