from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.models.store import Store
from app.schemas.public import (
    PublicSitemapProduct,
    PublicSitemapResponse,
    PublicSitemapStore,
)

router = APIRouter(prefix="/sitemap", tags=["public-sitemap"])


@router.get("", response_model=PublicSitemapResponse)
def get_sitemap_data(db: Session = Depends(get_db)) -> PublicSitemapResponse:
    """Lightweight index of public storefront URLs (roadmap task 18).

    Consumed by the Next.js sitemap generator to list active stores and
    their active products.
    """
    store_rows = db.execute(
        select(Store.slug)
        .where(Store.is_active.is_(True), Store.is_published.is_(True))
        .order_by(Store.id)
    ).all()
    product_rows = db.execute(
        select(Product.id, Store.slug)
        .join(Store, Product.store_id == Store.id)
        .where(
            Store.is_active.is_(True),
            Store.is_published.is_(True),
            Product.is_active.is_(True),
        )
        .order_by(Product.id)
    ).all()
    return PublicSitemapResponse(
        stores=[PublicSitemapStore(slug=row.slug) for row in store_rows],
        products=[
            PublicSitemapProduct(store_slug=row.slug, product_id=row.id)
            for row in product_rows
        ],
    )
