from fastapi import APIRouter, Depends

from app.api.deps import require_area
from app.api.v1.seller.analytics import router as analytics_router
from app.api.v1.seller.categories import router as categories_router
from app.api.v1.seller.conversations import router as conversations_router
from app.api.v1.seller.customers import router as customers_router
from app.api.v1.seller.dashboard import router as dashboard_router
from app.api.v1.seller.discounts import router as discounts_router
from app.api.v1.seller.domain import router as domain_router
from app.api.v1.seller.exports import router as exports_router
from app.api.v1.seller.messenger import router as messenger_router
from app.api.v1.seller.orders import router as orders_router
from app.api.v1.seller.onboarding import router as onboarding_router
from app.api.v1.seller.payment_methods import router as payment_methods_router
from app.api.v1.seller.products import router as products_router
from app.api.v1.seller.reports import router as reports_router
from app.api.v1.seller.shipping_methods import router as shipping_methods_router
from app.api.v1.seller.store import router as store_router
from app.api.v1.seller.subscription import router as subscription_router
from app.api.v1.seller.team import router as team_router
from app.api.v1.seller.team import self_router as team_self_router

router = APIRouter(prefix="/seller", tags=["seller"])

# Every seller endpoint sits in an area; staff roles are checked against it
# on each request (app/services/team_service.py: AREA_ROLES).
_AREAS = [
    (store_router, "store"),
    (categories_router, "products"),
    (products_router, "products"),
    (payment_methods_router, "payments"),
    (shipping_methods_router, "payments"),
    (orders_router, "orders"),
    (dashboard_router, "dashboard"),
    (onboarding_router, "onboarding"),
    (conversations_router, "conversations"),
    (customers_router, "customers"),
    (discounts_router, "discounts"),
    (analytics_router, "analytics"),
    (reports_router, "analytics"),
    (subscription_router, "subscription"),
    (exports_router, "exports"),
    (messenger_router, "messenger"),
    (team_router, "team"),
    (domain_router, "domain"),
]
for sub_router, area in _AREAS:
    router.include_router(sub_router, dependencies=[Depends(require_area(area))])
# Accepting an invite and listing your stores: any seller, for themselves.
router.include_router(team_self_router)

__all__ = ["router"]
