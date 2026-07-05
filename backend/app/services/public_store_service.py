from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.customer_portal import CustomerReview
from app.models.order import Order
from app.models.product import Product
from app.models.store import Store, StoreTrustBadge
from app.models.enums import ReviewStatus
from app.services.review_service import get_review_summary, list_reviews_for_store
from app.services.trust_service import list_active_badges
from app.services.exceptions import ServiceError


def get_active_store_by_slug(db: Session, slug: str) -> Store:
    store = db.scalar(
        select(Store)
        .options(
            selectinload(Store.social_links),
            selectinload(Store.payment_methods),
            selectinload(Store.products).selectinload(Product.images),
            selectinload(Store.products).selectinload(Product.form_fields),
            selectinload(Store.trust_badges),
        )
        .where(Store.slug == slug)
    )
    if store is None or not store.is_active:
        raise ServiceError("Store not found", status_code=404)
    return store


def list_available_products(db: Session, store_id: int) -> list[Product]:
    return list(
        db.scalars(
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.form_fields),
            )
            .where(Product.store_id == store_id, Product.is_active.is_(True))
            .order_by(Product.id)
        ).all()
    )


def get_public_product(db: Session, store: Store, product_id: int) -> Product:
    product = db.scalar(
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.form_fields),
        )
        .where(
            Product.id == product_id,
            Product.store_id == store.id,
            Product.is_active.is_(True),
        )
    )
    if product is None:
        raise ServiceError("Product not found", status_code=404)
    return product


def list_active_social_links(db: Session, store_id: int) -> list:
    store = db.get(Store, store_id)
    if store is None:
        return []
    return [link for link in store.social_links if link.is_active]


def list_active_payment_methods(db: Session, store_id: int):
    store = db.get(Store, store_id)
    if store is None:
        return []
    return [payment_method for payment_method in store.payment_methods if payment_method.is_active]


def list_public_reviews(db: Session, store_id: int, *, limit: int = 6):
    return get_review_summary(db, store_id, limit=limit)


def get_store_page(db: Session, slug: str):
    store = get_active_store_by_slug(db, slug)
    products = list_available_products(db, store.id)
    social_links = list_active_social_links(db, store.id)
    payment_methods = list_active_payment_methods(db, store.id)
    reviews, average_rating, review_count = list_public_reviews(db, store.id)
    badges = list_active_badges(db, store.id)
    return (
        store,
        products,
        social_links,
        payment_methods,
        reviews,
        average_rating,
        review_count,
        badges,
    )


def get_product_page(db: Session, slug: str, product_id: int):
    store = get_active_store_by_slug(db, slug)
    product = get_public_product(db, store, product_id)
    reviews, average_rating, review_count = list_public_reviews(db, store.id)
    badges = list_active_badges(db, store.id)
    return store, product, reviews, average_rating, review_count, badges
