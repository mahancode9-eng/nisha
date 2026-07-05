from app.api.v1.admin import router as admin_router
from app.api.v1.customer import router as customer_router
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.public import router as public_router
from app.api.v1.seller import router as seller_router

__all__ = [
    "admin_router",
    "auth_router",
    "customer_router",
    "health_router",
    "public_router",
    "seller_router",
]
