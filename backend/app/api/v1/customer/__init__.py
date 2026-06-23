from fastapi import APIRouter

from app.api.v1.customer.dashboard import router as dashboard_router
from app.api.v1.customer.auth import router as auth_router
from app.api.v1.customer.checkout import router as checkout_router
from app.api.v1.customer.conversations import router as conversations_router
from app.api.v1.customer.orders import router as orders_router
from app.api.v1.customer.profile import router as profile_router
from app.api.v1.customer.recovery import router as recovery_router

router = APIRouter(prefix="/customer")
router.include_router(auth_router)
router.include_router(checkout_router)
router.include_router(conversations_router)
router.include_router(profile_router)
router.include_router(recovery_router)
router.include_router(orders_router)
router.include_router(dashboard_router)

__all__ = ["router"]
