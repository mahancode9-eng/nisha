from __future__ import annotations

from typing import Iterable

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.store_categories import STORE_CATEGORIES, StoreCategoryOption
from app.models.customer_portal import CustomerReview
from app.models.enums import ReviewStatus
from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.schemas.product import ProductFormFieldResponse, ProductImageResponse
from app.schemas.public import (
    PublicHomepageCategory,
    PublicHomepageProduct,
    PublicHomepageResponse,
    PublicHomepageReview,
    PublicHomepageStats,
    PublicHomepageStore,
    PublicProduct,
    PublicStoreProfile,
)
from app.services.review_service import get_review_summary, list_public_reviews_for_store


def _public_store(store: Store) -> PublicStoreProfile:
    return PublicStoreProfile.model_validate(store)


def _public_product(product: Product) -> PublicProduct:
    return PublicProduct(
        id=product.id,
        title=product.title,
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity,
        images=[ProductImageResponse.model_validate(img) for img in product.images],
        form_fields=[ProductFormFieldResponse.model_validate(field) for field in product.form_fields],
        image_count=len(product.images),
    )


def _search_filter(term: str):
    like = f"%{term.strip()}%"
    return or_(
        Product.title.ilike(like),
        Product.description.ilike(like),
        Store.name.ilike(like),
        Store.description.ilike(like),
    )


def _store_rows(db: Session, *, query: str | None = None, limit: int = 6):
    product_counts = (
        select(Product.store_id, func.count(Product.id).label("product_count"))
        .where(Product.is_active.is_(True))
        .group_by(Product.store_id)
        .subquery()
    )
    review_counts = (
        select(
            CustomerReview.store_id,
            func.count(CustomerReview.id).label("review_count"),
            func.coalesce(func.avg(CustomerReview.rating), 0).label("average_rating"),
        )
        .where(CustomerReview.status == ReviewStatus.APPROVED)
        .group_by(CustomerReview.store_id)
        .subquery()
    )
    stmt = (
        select(
            Store,
            func.coalesce(product_counts.c.product_count, 0).label("product_count"),
            func.coalesce(review_counts.c.review_count, 0).label("review_count"),
            func.coalesce(review_counts.c.average_rating, 0).label("average_rating"),
        )
        .outerjoin(product_counts, Store.id == product_counts.c.store_id)
        .outerjoin(review_counts, Store.id == review_counts.c.store_id)
        .where(Store.is_active.is_(True))
    )
    if query:
        stmt = stmt.where(or_(Store.name.ilike(f"%{query}%"), Store.description.ilike(f"%{query}%")))
    return list(
        db.execute(
            stmt.order_by(
                func.coalesce(review_counts.c.review_count, 0).desc(),
                Store.created_at.desc(),
            ).limit(limit)
        ).all()
    )


def _product_rows(db: Session, *, query: str | None = None, limit: int = 8):
    stmt = (
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.form_fields),
            selectinload(Product.store),
        )
        .join(Store, Product.store_id == Store.id)
        .where(Product.is_active.is_(True), Store.is_active.is_(True))
    )
    if query:
        stmt = stmt.where(_search_filter(query))
    return list(db.scalars(stmt.order_by(Product.created_at.desc()).limit(limit)).all())


def _reviews(db: Session, *, limit: int = 6) -> list[CustomerReview]:
    return list(
        db.scalars(
            select(CustomerReview)
            .options(
                selectinload(CustomerReview.customer),
                selectinload(CustomerReview.order).selectinload(Order.store),
                selectinload(CustomerReview.order).selectinload(Order.items),
                selectinload(CustomerReview.images),
                selectinload(CustomerReview.store),
            )
            .where(CustomerReview.status == ReviewStatus.APPROVED)
            .order_by(CustomerReview.created_at.desc())
            .limit(limit)
        ).all()
    )


def _category_count(db: Session, category: StoreCategoryOption) -> int:
    patterns = [f"%{keyword}%" for keyword in category.keywords]
    return (
        db.scalar(
            select(func.count())
            .select_from(Product)
            .join(Store, Product.store_id == Store.id)
            .where(
                Product.is_active.is_(True),
                Store.is_active.is_(True),
                or_(*[Product.title.ilike(pattern) for pattern in patterns], *[Product.description.ilike(pattern) for pattern in patterns]),
            )
        )
        or 0
    )


def get_homepage_discovery(db: Session, query: str | None = None) -> PublicHomepageResponse:
    query = query.strip() if query else None
    store_rows = _store_rows(db, query=query, limit=6)
    product_rows = _product_rows(db, query=query, limit=8)
    review_rows = _reviews(db, limit=6)

    stores = []
    for row in store_rows:
        store = row[0]
        _, average_rating, review_count = get_review_summary(db, store.id, limit=3)
        stores.append(
            PublicHomepageStore(
                store=_public_store(store),
                product_count=int(row.product_count or 0),
                average_rating=float(average_rating),
                review_count=int(review_count),
            )
        )

    products: list[PublicHomepageProduct] = []
    for product in product_rows:
        _, average_rating, review_count = get_review_summary(db, product.store_id, limit=3)
        products.append(
            PublicHomepageProduct(
                product=_public_product(product),
                store=_public_store(product.store),
                average_rating=float(average_rating),
                review_count=int(review_count),
            )
        )

    categories = [
        PublicHomepageCategory(
            label=category.label,
            slug=category.slug,
            query=category.query,
            product_count=_category_count(db, category),
            icon_key=category.icon_key,
        )
        for category in STORE_CATEGORIES
    ]

    recent_reviews = [
        PublicHomepageReview(
            id=review.id,
            store_name=review.store.name if review.store else (review.order.store.name if review.order and review.order.store else "Store"),
            store_slug=review.store.slug if review.store else (review.order.store.slug if review.order and review.order.store else ""),
            product_title=review.order.items[0].product_title_snapshot if review.order and review.order.items else None,
            customer_name=review.customer.full_name if review.customer else review.order.buyer_name if review.order else "Customer",
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            image_urls=[image.image_url for image in review.images],
            created_at=review.created_at,
        )
        for review in review_rows
    ]

    active_store_count = db.scalar(select(func.count()).select_from(Store).where(Store.is_active.is_(True))) or 0
    active_product_count = (
        db.scalar(
            select(func.count())
            .select_from(Product)
            .join(Store, Product.store_id == Store.id)
            .where(Product.is_active.is_(True), Store.is_active.is_(True))
        )
        or 0
    )
    total_reviews = db.scalar(select(func.count()).select_from(CustomerReview).where(CustomerReview.status == ReviewStatus.APPROVED)) or 0
    average_rating = db.scalar(
        select(func.coalesce(func.avg(CustomerReview.rating), 0)).where(CustomerReview.status == ReviewStatus.APPROVED)
    ) or 0

    hero_title = "Discover trusted stores and products"
    hero_subtitle = "Search products, compare sellers, and buy with invoice-based checkout and moderated reviews."
    if query:
        hero_title = f"Search results for \"{query}\""
        hero_subtitle = "Browse matching products and stores from across the platform."

    return PublicHomepageResponse(
        query=query,
        hero_title=hero_title,
        hero_subtitle=hero_subtitle,
        search_hint="Search products, stores, or keywords",
        stats=PublicHomepageStats(
            total_stores=int(active_store_count),
            total_products=int(active_product_count),
            total_reviews=int(total_reviews),
            average_rating=float(average_rating),
        ),
        categories=categories,
        featured_products=products,
        featured_stores=stores,
        recent_reviews=recent_reviews,
        trust_indicators=[
            "Verified invoice-based checkout",
            "Moderated customer reviews",
            "Guest orders supported",
            "Persistent order chat and complaints",
        ],
    )
