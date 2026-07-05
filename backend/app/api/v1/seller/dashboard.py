from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.dashboard import SellerDashboardResponse
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["seller-dashboard"])


@router.get("", response_model=SellerDashboardResponse)
def get_dashboard(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SellerDashboardResponse:
    return dashboard_service.get_dashboard(db, store)
