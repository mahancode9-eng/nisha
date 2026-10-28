from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.api.service_http import raise_service_error
from app.db.session import get_db
from app.models.store import Store
from app.schemas.sales_report import SalesReportResponse
from app.services import entitlement_service, sales_report_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/reports", tags=["seller-reports"])


@router.get("/sales", response_model=SalesReportResponse)
def get_sales_report(
    days: int = Query(default=30, ge=1, le=90),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SalesReportResponse:
    try:
        entitlement_service.require_entitlement(
            db,
            store.owner_id,
            "sales_report",
            message="گزارش فروش تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده.",
        )
    except ServiceError as exc:
        raise_service_error(exc)
    entitlements = entitlement_service.get_seller_entitlements(db, store.owner_id)
    max_days = entitlement_service.get_analytics_max_days(entitlements)
    clamped = min(days, max_days)
    return sales_report_service.get_sales_report(db, store.id, days=clamped)
