"""Storefront product search, filtering and sorting (roadmap task 14).

Persian-aware text search: the query text and the searched columns are both
normalized (Arabic Yeh/Kaf variants, half-space removal) before matching, so
queries typed with either spelling return the same results.

On PostgreSQL the LIKE lookups are accelerated by the pg_trgm GIN index
created in migration 20260706_0012. The exact same code path also works on
SQLite in tests (functional replace/lower chain, no extension required).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import OrderItem
from app.models.product import Product
from app.models.product_category import ProductCategory

SortKey = Literal["newest", "cheapest", "most_expensive", "best_selling"]

DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 60

# Normalization pairs applied to both the search query and the columns.
# Kept as unicode escapes on purpose: half-space and RTL marks are invisible
# characters and would be easy to break in review otherwise.
_CHAR_MAP: list[tuple[str, str]] = [
    ("\u064a", "\u06cc"),  # Arabic Yeh -> Persian Yeh
    ("\u0649", "\u06cc"),  # Alef Maksura -> Persian Yeh
    ("\u0643", "\u06a9"),  # Arabic Kaf -> Persian Kaf
    ("\u0629", "\u0647"),  # Teh Marbuta -> Heh
    ("\u0623", "\u0627"),  # Alef with Hamza above -> Alef
    ("\u0625", "\u0627"),  # Alef with Hamza below -> Alef
    ("\u0640", ""),  # Tatweel (kashida)
    ("\u200c", ""),  # Zero-width non-joiner (half-space) is removed entirely
    ("\u200f", ""),  # Right-to-left mark
]


def normalize_text(value: str) -> str:
    """Normalize free text for Persian-aware comparison."""
    result = value.lower()
    for source, target in _CHAR_MAP:
        result = result.replace(source, target)
    return " ".join(result.split())


def _normalized_expression(expression):
    """Apply the same normalization chain to a SQL expression."""
    normalized = func.lower(expression)
    for source, target in _CHAR_MAP:
        normalized = func.replace(normalized, source, target)
    return normalized


def _search_tokens(q: str) -> list[str]:
    # LIKE wildcards are stripped rather than escaped: a public search box
    # never needs literal percent/underscore matching and this keeps the
    # generated SQL portable between SQLite and PostgreSQL.
    cleaned = normalize_text(q).replace("%", " ").replace("_", " ")
    return cleaned.split()


def search_products(
    db: Session,
    store_id: int,
    *,
    q: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    in_stock: bool = False,
    category_slug: str | None = None,
    sort: SortKey = "newest",
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> tuple[list[Product], int]:
    """Return (products, total) for the storefront product browser."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), MAX_PAGE_SIZE)

    filters = [Product.store_id == store_id, Product.is_active.is_(True)]

    if q:
        haystack = _normalized_expression(
            Product.title + " " + func.coalesce(Product.description, "")
        )
        # Second haystack with spaces removed so a query written with a
        # half-space (normalized away) still matches a title written with a
        # plain space, and vice versa.
        haystack_joined = func.replace(haystack, " ", "")
        for token in _search_tokens(q):
            pattern = "%" + token + "%"
            filters.append(
                or_(haystack.like(pattern), haystack_joined.like(pattern))
            )

    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if in_stock:
        filters.append(Product.stock_quantity > 0)
    if category_slug:
        filters.append(
            Product.category_id.in_(
                select(ProductCategory.id).where(
                    ProductCategory.store_id == store_id,
                    ProductCategory.slug == category_slug,
                    ProductCategory.is_active.is_(True),
                )
            )
        )

    total = int(db.scalar(select(func.count(Product.id)).where(*filters)) or 0)

    stmt = (
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.form_fields),
            selectinload(Product.variants),
            selectinload(Product.category),
        )
        .where(*filters)
    )

    if sort == "cheapest":
        stmt = stmt.order_by(Product.price.asc(), Product.id.asc())
    elif sort == "most_expensive":
        stmt = stmt.order_by(Product.price.desc(), Product.id.asc())
    elif sort == "best_selling":
        units_sold = (
            select(func.coalesce(func.sum(OrderItem.quantity), 0))
            .where(OrderItem.product_id == Product.id)
            .correlate(Product)
            .scalar_subquery()
        )
        stmt = stmt.order_by(units_sold.desc(), Product.id.desc())
    else:  # newest
        stmt = stmt.order_by(Product.id.desc())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    products = list(db.scalars(stmt).all())
    return products, total
