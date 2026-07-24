from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import AdminPlatformSettingsResponse, AdminPlatformSettingsUpdate
from app.services import platform_setting_service

router = APIRouter(prefix="/settings", tags=["admin-settings"])


@router.get("", response_model=AdminPlatformSettingsResponse)
def get_platform_settings(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminPlatformSettingsResponse:
    return AdminPlatformSettingsResponse(
        guest_checkout_enabled=platform_setting_service.is_platform_guest_checkout_enabled(db),
    )


@router.patch("", response_model=AdminPlatformSettingsResponse)
def update_platform_settings(
    payload: AdminPlatformSettingsUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminPlatformSettingsResponse:
    platform_setting_service.set_bool(
        db,
        platform_setting_service.GUEST_CHECKOUT_PLATFORM_KEY,
        payload.guest_checkout_enabled,
    )
    return AdminPlatformSettingsResponse(
        guest_checkout_enabled=platform_setting_service.is_platform_guest_checkout_enabled(db),
    )
