from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.public import PublicHomepageResponse
from app.services.homepage_service import get_homepage_discovery

router = APIRouter(prefix="/home", tags=["public-home"])


@router.get("", response_model=PublicHomepageResponse, response_model_exclude_none=True)
def get_homepage(query: str | None = None, db: Session = Depends(get_db)) -> PublicHomepageResponse:
    return get_homepage_discovery(db, query=query)
