from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.report import SalesReportResponse
from app.services import sales_report_service

router = APIRouter(prefix="/reports", tags=["seller-reports"])


@router.get("/sales", response_model=SalesReportResponse)
def get_sales_report(
    month: str | None = Query(default=None, max_length=7, description="Jalali month, e.g. 1404-08"),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SalesReportResponse:
    return sales_report_service.monthly_sales(db, store, month)
