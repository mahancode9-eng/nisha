from fastapi import APIRouter

from app.api.v1.public.home import router as home_router
from app.api.v1.public.orders import router as orders_router
from app.api.v1.public.stores import router as stores_router
from app.api.v1.public.uploads import router as uploads_router

router = APIRouter(prefix="/public", tags=["public"])
router.include_router(home_router)
router.include_router(stores_router)
router.include_router(orders_router)
router.include_router(uploads_router)

__all__ = ["router"]
