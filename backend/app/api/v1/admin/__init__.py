from fastapi import APIRouter

from app.api.v1.admin.chats import router as chats_router
from app.api.v1.admin.dashboard import router as dashboard_router
from app.api.v1.admin.orders import router as orders_router
from app.api.v1.admin.reviews import router as reviews_router
from app.api.v1.admin.stores import router as stores_router

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(dashboard_router)
router.include_router(stores_router)
router.include_router(orders_router)
router.include_router(reviews_router)
router.include_router(chats_router)

__all__ = ["router"]
