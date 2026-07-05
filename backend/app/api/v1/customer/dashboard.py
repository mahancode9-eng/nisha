from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.schemas.customer_portal import CustomerDashboardSummary
from app.services.customer_order_service import get_dashboard_summary

router = APIRouter(tags=["customer-dashboard"])


@router.get("/dashboard", response_model=CustomerDashboardSummary)
def get_dashboard(
    customer: CustomerAccount = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerDashboardSummary:
    return get_dashboard_summary(db, customer)

