from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import AdminDashboardResponse
from app.services import admin_dashboard_service

router = APIRouter(prefix="/dashboard", tags=["admin-dashboard"])


@router.get("", response_model=AdminDashboardResponse)
def get_dashboard(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDashboardResponse:
    return admin_dashboard_service.get_admin_dashboard(db)
