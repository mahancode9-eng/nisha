from __future__ import annotations

from datetime import UTC, datetime
from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer_account import CustomerAccount
from app.models.customer_portal import CustomerReview, CustomerReviewImage
from app.models.enums import OrderStatus, ReviewStatus
from app.models.order import Order
from app.models.user import User
from app.schemas.admin import AdminReviewListItem
from app.schemas.customer_portal import CustomerReviewCreateRequest, CustomerReviewResponse
from app.schemas.public import PublicProductReview, PublicStoreReview, PublicStoreReviewSummary
from app.services.exceptions import ServiceError


def _load_order(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items), selectinload(Order.store))
        .where(Order.id == order_id)
    )
    if order is None:
        raise ServiceError("Order not found", status_code=404)
    return order


def _image_urls(review: CustomerReview) -> list[str]:
    return [image.image_url for image in review.images]


def _review_author_name(review: CustomerReview) -> str:
    if review.customer is not None:
        return review.customer.full_name
    if review.order is not None:
        return review.order.buyer_name
    return "Buyer"


def _review_to_response(review: CustomerReview) -> CustomerReviewResponse:
    return CustomerReviewResponse(
        id=review.id,
        order_id=review.order_id,
        store_id=review.store_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        status=review.status,
        image_urls=_image_urls(review),
        is_public=review.status == ReviewStatus.APPROVED,
        moderation_note=review.moderation_note,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def _public_review(review: CustomerReview) -> PublicStoreReview:
    return PublicStoreReview(
        id=review.id,
        order_id=review.order_id,
        customer_name=_review_author_name(review),
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        image_urls=_image_urls(review),
        status=review.status,
        created_at=review.created_at,
    )


def _public_product_review(review: CustomerReview) -> PublicProductReview:
    return PublicProductReview.model_validate(_public_review(review).model_dump())


def _sync_review_images(db: Session, review: CustomerReview, image_urls: Iterable[str]) -> None:
    for image in list(review.images):
        db.delete(image)
    db.flush()
    for index, url in enumerate(image_urls):
        db.add(
            CustomerReviewImage(
                review_id=review.id,
                image_url=url,
                thumbnail_url=None,
                sort_order=index,
            )
        )


def create_or_update_review(
    db: Session,
    *,
    order: Order,
    customer_id: int | None,
    payload: CustomerReviewCreateRequest,
) -> CustomerReviewResponse:
    if order.status != OrderStatus.DELIVERED:
        raise ServiceError("Reviews are available after delivery", status_code=422)

    review = db.scalar(
        select(CustomerReview)
        .options(selectinload(CustomerReview.images), selectinload(CustomerReview.customer), selectinload(CustomerReview.order))
        .where(CustomerReview.order_id == order.id)
    )

    status = ReviewStatus.PENDING if payload.is_public else ReviewStatus.PRIVATE
    if review is None:
        review = CustomerReview(
            order_id=order.id,
            customer_id=customer_id or order.customer_id,
            store_id=order.store_id,
            rating=payload.rating,
            title=payload.title.strip() if payload.title else None,
            comment=payload.comment.strip() if payload.comment else None,
            status=status,
            moderated_by_user_id=None,
            moderated_at=None,
            moderation_note=None,
        )
        db.add(review)
        db.flush()
    else:
        review.customer_id = customer_id or review.customer_id or order.customer_id
        review.rating = payload.rating
        review.title = payload.title.strip() if payload.title else None
        review.comment = payload.comment.strip() if payload.comment else None
        review.status = status
        review.moderated_by_user_id = None if status != ReviewStatus.APPROVED else review.moderated_by_user_id
        review.moderated_at = None if status == ReviewStatus.PENDING else review.moderated_at
        review.moderation_note = None if status == ReviewStatus.PENDING else review.moderation_note

    _sync_review_images(db, review, payload.image_urls)
    db.commit()
    db.refresh(review)
    return _review_to_response(review)


def list_customer_reviews(db: Session, customer_id: int) -> list[CustomerReviewResponse]:
    reviews = list(
        db.scalars(
            select(CustomerReview)
            .options(selectinload(CustomerReview.images))
            .where(CustomerReview.customer_id == customer_id)
            .order_by(CustomerReview.created_at.desc())
        ).all()
    )
    return [_review_to_response(review) for review in reviews]


def list_pending_reviews(db: Session) -> list[AdminReviewListItem]:
    reviews = list(
        db.scalars(
            select(CustomerReview)
            .options(selectinload(CustomerReview.images))
            .where(CustomerReview.status == ReviewStatus.PENDING)
            .order_by(CustomerReview.created_at.desc())
        ).all()
    )
    return [_admin_review_item(review) for review in reviews]


def list_reviews_for_store(
    db: Session,
    store_id: int,
    *,
    limit: int = 6,
) -> list[CustomerReview]:
    return list(
        db.scalars(
            select(CustomerReview)
            .options(selectinload(CustomerReview.images), selectinload(CustomerReview.customer), selectinload(CustomerReview.order))
            .where(
                CustomerReview.store_id == store_id,
                CustomerReview.status == ReviewStatus.APPROVED,
            )
            .order_by(CustomerReview.created_at.desc())
            .limit(limit)
        ).all()
    )


def get_review_summary(db: Session, store_id: int, *, limit: int = 6) -> tuple[list[CustomerReview], float, int]:
    reviews = list_reviews_for_store(db, store_id, limit=limit)
    avg = db.scalar(
        select(func.coalesce(func.avg(CustomerReview.rating), 0)).where(
            CustomerReview.store_id == store_id,
            CustomerReview.status == ReviewStatus.APPROVED,
        )
    ) or 0
    count = db.scalar(
        select(func.count()).select_from(CustomerReview).where(
            CustomerReview.store_id == store_id,
            CustomerReview.status == ReviewStatus.APPROVED,
        )
    ) or 0
    return reviews, float(avg), int(count)


def approve_review(db: Session, review_id: int, admin: User, *, note: str | None = None) -> CustomerReviewResponse:
    review = db.scalar(
        select(CustomerReview)
        .options(selectinload(CustomerReview.images), selectinload(CustomerReview.customer), selectinload(CustomerReview.order))
        .where(CustomerReview.id == review_id)
    )
    if review is None:
        raise ServiceError("Review not found", status_code=404)
    if review.status != ReviewStatus.PENDING:
        raise ServiceError("Only pending reviews can be approved", status_code=422)
    review.status = ReviewStatus.APPROVED
    review.moderated_by_user_id = admin.id
    review.moderated_at = datetime.now(UTC)
    review.moderation_note = note.strip() if note else None
    db.commit()
    db.refresh(review)
    return _review_to_response(review)


def reject_review(db: Session, review_id: int, admin: User, *, note: str | None = None) -> CustomerReviewResponse:
    review = db.scalar(
        select(CustomerReview)
        .options(selectinload(CustomerReview.images), selectinload(CustomerReview.customer), selectinload(CustomerReview.order))
        .where(CustomerReview.id == review_id)
    )
    if review is None:
        raise ServiceError("Review not found", status_code=404)
    if review.status != ReviewStatus.PENDING:
        raise ServiceError("Only pending reviews can be rejected", status_code=422)
    review.status = ReviewStatus.REJECTED
    review.moderated_by_user_id = admin.id
    review.moderated_at = datetime.now(UTC)
    review.moderation_note = note.strip() if note else None
    db.commit()
    db.refresh(review)
    return _review_to_response(review)


def list_public_reviews_for_store(db: Session, store_id: int, *, limit: int = 6) -> tuple[list[PublicStoreReview], float, int]:
    reviews = list_reviews_for_store(db, store_id, limit=limit)
    public_reviews = [_public_review(review) for review in reviews]
    avg = db.scalar(
        select(func.coalesce(func.avg(CustomerReview.rating), 0)).where(
            CustomerReview.store_id == store_id,
            CustomerReview.status == ReviewStatus.APPROVED,
        )
    ) or 0
    count = db.scalar(
        select(func.count()).select_from(CustomerReview).where(
            CustomerReview.store_id == store_id,
            CustomerReview.status == ReviewStatus.APPROVED,
        )
    ) or 0
    return public_reviews, float(avg), int(count)


def admin_review_item(review: CustomerReview) -> AdminReviewListItem:
    return _admin_review_item(review)


def _admin_review_item(review: CustomerReview) -> AdminReviewListItem:
    return AdminReviewListItem(
        id=review.id,
        order_id=review.order_id,
        store_id=review.store_id,
        customer_id=review.customer_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        status=review.status,
        image_urls=_image_urls(review),
        moderation_note=review.moderation_note,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def get_review_public_payload(review: CustomerReview) -> PublicStoreReview:
    return _public_review(review)
