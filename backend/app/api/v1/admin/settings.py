from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import AdminPlatformSettingsResponse, AdminPlatformSettingsUpdate
from app.services import platform_setting_service

router = APIRouter(prefix="/settings", tags=["admin-settings"])


def _settings_response(db: Session) -> AdminPlatformSettingsResponse:
    cards = platform_setting_service.get_subscription_card_settings(db)
    return AdminPlatformSettingsResponse(
        guest_checkout_enabled=platform_setting_service.is_platform_guest_checkout_enabled(db),
        subscription_card_number=cards["subscription_card_number"],
        subscription_card_owner=cards["subscription_card_owner"],
        subscription_card_bank=cards["subscription_card_bank"],
    )


@router.get("", response_model=AdminPlatformSettingsResponse)
def get_platform_settings(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminPlatformSettingsResponse:
    return _settings_response(db)


@router.patch("", response_model=AdminPlatformSettingsResponse)
def update_platform_settings(
    payload: AdminPlatformSettingsUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminPlatformSettingsResponse:
    if payload.guest_checkout_enabled is not None:
        platform_setting_service.set_bool(
            db,
            platform_setting_service.GUEST_CHECKOUT_PLATFORM_KEY,
            payload.guest_checkout_enabled,
        )
    if any(
        value is not None
        for value in (
            payload.subscription_card_number,
            payload.subscription_card_owner,
            payload.subscription_card_bank,
        )
    ):
        platform_setting_service.set_subscription_card_settings(
            db,
            card_number=payload.subscription_card_number,
            card_owner=payload.subscription_card_owner,
            card_bank=payload.subscription_card_bank,
        )
    return _settings_response(db)
