from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductFormFieldResponse, ProductImageResponse
from app.schemas.public import (
    PublicProductDetailResponse,
    GuestOrderCreate,
    PublicPaymentMethod,
    PublicProduct,
    PublicProductListResponse,
    PublicProductVariant,
    PublicStorePageResponse,
    PublicStoreProfile,
    PublicStoreReview,
    PublicStoreReviewSummary,
    PublicStoreSocialLink,
    CheckoutResponse,
)
from app.services import checkout_service, product_search_service, public_store_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/stores", tags=["public-stores"])


def _public_product(product) -> PublicProduct:
    return PublicProduct(
        id=product.id,
        title=product.title,
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity,
        video_url=product.video_url,
        video_mime_type=product.video_mime_type,
        images=[ProductImageResponse.model_validate(img) for img in product.images],
        form_fields=[ProductFormFieldResponse.model_validate(field) for field in product.form_fields],
        variants=[
            PublicProductVariant.model_validate(variant)
            for variant in product.variants
            if variant.is_active
        ],
        image_count=len(product.images),
    )


@router.get("/{slug}", response_model=PublicStorePageResponse, response_model_exclude_none=True)
def get_public_store(slug: str, db: Session = Depends(get_db)) -> PublicStorePageResponse:
    try:
        store, products, social_links, payment_methods, reviews, average_rating, review_count, badges = (
            public_store_service.get_store_page(db, slug)
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    store_profile = PublicStoreProfile.model_validate(store).model_copy(
        update={"trust_badges": [badge.badge_type.value for badge in badges]}
    )

    return PublicStorePageResponse(
        store=store_profile,
        social_links=[PublicStoreSocialLink.model_validate(link) for link in social_links],
        products=[_public_product(product) for product in products],
        payment_methods=[PublicPaymentMethod.model_validate(m) for m in payment_methods],
        review_summary=PublicStoreReviewSummary(
            average_rating=average_rating,
            review_count=review_count,
            recent_reviews=[
                PublicStoreReview(
                    id=review.id,
                    order_id=review.order_id,
                    customer_name=review.customer.full_name if review.customer else "Customer",
                    rating=review.rating,
                    title=review.title,
                    comment=review.comment,
                    image_urls=[image.image_url for image in review.images],
                    created_at=review.created_at,
                )
                for review in reviews
            ],
        ),
    )


@router.get("/{slug}/products/{product_id}", response_model=PublicProductDetailResponse, response_model_exclude_none=True)
def get_public_product(slug: str, product_id: int, db: Session = Depends(get_db)) -> PublicProductDetailResponse:
    try:
        store, product, reviews, average_rating, review_count, badges = public_store_service.get_product_page(
            db,
            slug,
            product_id,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    product_payload = _public_product(product)
    review_payloads = [
        PublicStoreReview(
            id=review.id,
            order_id=review.order_id,
            customer_name=review.customer.full_name if review.customer else review.order.buyer_name if review.order else "Customer",
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            image_urls=[image.image_url for image in review.images],
            status=review.status,
            created_at=review.created_at,
        )
        for review in reviews
    ]
    store_profile = PublicStoreProfile.model_validate(store).model_copy(
        update={"trust_badges": [badge.badge_type.value for badge in badges]}
    )
    return PublicProductDetailResponse(
        store=store_profile,
        product=product_payload,
        review_summary=PublicStoreReviewSummary(
            average_rating=average_rating,
            review_count=review_count,
            recent_reviews=review_payloads[:6],
        ),
        public_reviews=review_payloads,
    )


@router.get(
    "/{slug}/products",
    response_model=PublicProductListResponse,
    response_model_exclude_none=True,
)
def list_public_products(
    slug: str,
    q: str | None = Query(default=None, max_length=200),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    in_stock: bool = Query(default=False),
    sort: Literal["newest", "cheapest", "most_expensive", "best_selling"] = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=product_search_service.DEFAULT_PAGE_SIZE,
        ge=1,
        le=product_search_service.MAX_PAGE_SIZE,
    ),
    db: Session = Depends(get_db),
) -> PublicProductListResponse:
    try:
        store = public_store_service.get_active_store_by_slug(db, slug)
        products, total = product_search_service.search_products(
            db,
            store.id,
            q=q,
            min_price=min_price,
            max_price=max_price,
            in_stock=in_stock,
            sort=sort,
            page=page,
            page_size=page_size,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return PublicProductListResponse(
        items=[_public_product(product) for product in products],
        total=total,
        page=page,
        page_size=page_size,
        has_more=page * page_size < total,
    )


@router.post(
    "/{slug}/orders",
    response_model=CheckoutResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
)
def create_guest_order(
    slug: str,
    payload: GuestOrderCreate,
    db: Session = Depends(get_db),
) -> CheckoutResponse:
    try:
        return checkout_service.create_guest_order(db, slug, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
