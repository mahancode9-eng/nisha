from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductFormFieldResponse, ProductImageResponse
from app.schemas.public import (
    PublicProductDetailResponse,
    GuestOrderCreate,
    PublicPaymentMethod,
    PublicProduct,
    PublicStorePageResponse,
    PublicStoreProfile,
    PublicStoreReview,
    PublicStoreReviewSummary,
    PublicStoreSocialLink,
    CheckoutResponse,
)
from app.services import checkout_service, public_store_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/stores", tags=["public-stores"])


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
        products=[
            PublicProduct(
                id=product.id,
                title=product.title,
                description=product.description,
                price=product.price,
                stock_quantity=product.stock_quantity,
                images=[ProductImageResponse.model_validate(img) for img in product.images],
                form_fields=[ProductFormFieldResponse.model_validate(field) for field in product.form_fields],
                image_count=len(product.images),
            )
            for product in products
        ],
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

    product_payload = PublicProduct(
        id=product.id,
        title=product.title,
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity,
        images=[ProductImageResponse.model_validate(img) for img in product.images],
        form_fields=[ProductFormFieldResponse.model_validate(field) for field in product.form_fields],
        image_count=len(product.images),
    )
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


@router.get("/{slug}/products", response_model=list[PublicProduct], response_model_exclude_none=True)
def list_public_products(slug: str, db: Session = Depends(get_db)) -> list[PublicProduct]:
    try:
        store = public_store_service.get_active_store_by_slug(db, slug)
        products = public_store_service.list_available_products(db, store.id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return [
        PublicProduct(
            id=product.id,
            title=product.title,
            description=product.description,
            price=product.price,
            stock_quantity=product.stock_quantity,
            images=[ProductImageResponse.model_validate(img) for img in product.images],
            form_fields=[ProductFormFieldResponse.model_validate(field) for field in product.form_fields],
            image_count=len(product.images),
        )
        for product in products
    ]


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
