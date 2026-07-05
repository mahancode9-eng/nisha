from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.customer_portal import CustomerReview
from app.models.user import User
from app.schemas.admin import AdminReviewListItem, AdminReviewModerationRequest
from app.services import review_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/reviews", tags=["admin-reviews"])


@router.get("", response_model=list[AdminReviewListItem])
def list_reviews(
    pending_only: bool = Query(default=True),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminReviewListItem]:
    if pending_only:
        return review_service.list_pending_reviews(db)
    return [
        review_service.admin_review_item(review)
        for review in db.scalars(
            select(CustomerReview).options(selectinload(CustomerReview.images))
            .order_by(CustomerReview.created_at.desc())
        ).all()
    ]


@router.patch("/{review_id}/approve", response_model=AdminReviewListItem)
def approve_review(
    review_id: int,
    payload: AdminReviewModerationRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminReviewListItem:
    try:
        review = review_service.approve_review(db, review_id, admin, note=payload.moderation_note)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminReviewListItem.model_validate(review)


@router.patch("/{review_id}/reject", response_model=AdminReviewListItem)
def reject_review(
    review_id: int,
    payload: AdminReviewModerationRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminReviewListItem:
    try:
        review = review_service.reject_review(db, review_id, admin, note=payload.moderation_note)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return AdminReviewListItem.model_validate(review)
