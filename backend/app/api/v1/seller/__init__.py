from fastapi import APIRouter

from app.api.v1.seller.conversations import router as conversations_router
from app.api.v1.seller.dashboard import router as dashboard_router
from app.api.v1.seller.orders import router as orders_router
from app.api.v1.seller.onboarding import router as onboarding_router
from app.api.v1.seller.payment_methods import router as payment_methods_router
from app.api.v1.seller.products import router as products_router
from app.api.v1.seller.store import router as store_router

router = APIRouter(prefix="/seller", tags=["seller"])
router.include_router(store_router)
router.include_router(products_router)
router.include_router(payment_methods_router)
router.include_router(orders_router)
router.include_router(dashboard_router)
router.include_router(onboarding_router)
router.include_router(conversations_router)

__all__ = ["router"]
