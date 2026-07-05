from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.onboarding import SellerOnboardingResponse, StoreOnboardingUpdate
from app.services import onboarding_service

router = APIRouter(prefix="/onboarding", tags=["seller-onboarding"])


@router.get("", response_model=SellerOnboardingResponse)
def get_onboarding(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SellerOnboardingResponse:
    return onboarding_service.get_onboarding_context(db, store)


@router.patch("", response_model=SellerOnboardingResponse)
def update_onboarding(
    payload: StoreOnboardingUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> SellerOnboardingResponse:
    return onboarding_service.update_onboarding_state(db, store, payload)

