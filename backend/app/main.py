from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import (
    admin_router,
    auth_router,
    customer_router,
    health_router,
    public_router,
    seller_router,
)
from app.core.config import settings
from app.core.error_handlers import (
    service_error_handler,
    unhandled_exception_handler,
    validation_error_handler,
)
from app.core.limiter import limiter, rate_limit_exceeded_handler
from app.core.logging_config import RequestLoggingMiddleware, setup_logging
from app.services.exceptions import ServiceError


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / settings.PAYMENT_PROOF_SUBDIR).mkdir(parents=True, exist_ok=True)

    if settings.DATABASE_URL.startswith("postgresql"):
        from alembic.config import Config as AlembicConfig
        from alembic.command import upgrade as alembic_upgrade
        alembic_cfg = AlembicConfig("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        alembic_upgrade(alembic_cfg, "head")

    yield


app = FastAPI(
    title="Nisha API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_exception_handler(ServiceError, service_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(seller_router, prefix="/api/v1")
app.include_router(public_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(customer_router, prefix="/api/v1")

upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "nisha-api"}
