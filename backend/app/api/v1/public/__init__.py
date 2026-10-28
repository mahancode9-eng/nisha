from fastapi import APIRouter

from app.api.v1.public.discounts import router as discounts_router
from app.api.v1.public.domains import router as domains_router
from app.api.v1.public.home import router as home_router
from app.api.v1.public.orders import router as orders_router
from app.api.v1.public.sitemap import router as sitemap_router
from app.api.v1.public.stores import router as stores_router
from app.api.v1.public.uploads import router as uploads_router
from app.api.v1.public.visits import router as visits_router
from app.api.v1.public.verify_email import router as verify_email_router
from app.api.v1.public.short_links import router as short_links_router

router = APIRouter(prefix="/public", tags=["public"])
router.include_router(home_router)
router.include_router(stores_router)
router.include_router(discounts_router)
router.include_router(orders_router)
router.include_router(uploads_router)
router.include_router(sitemap_router)
router.include_router(visits_router)
router.include_router(verify_email_router)
router.include_router(short_links_router)
router.include_router(domains_router)

__all__ = ["router"]
