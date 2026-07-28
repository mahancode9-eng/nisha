from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.product_category import ProductCategory
from app.models.store import Store
from app.schemas.product_category import ProductCategoryCreate, ProductCategoryUpdate
from app.services.exceptions import ServiceError
from app.utils.slug import slugify


def _unique_category_slug(db: Session, store_id: int, base_text: str, *, exclude_id: int | None = None) -> str:
    base_slug = slugify(base_text, max_length=80)
    slug = base_slug
    counter = 2
    while True:
        query = select(ProductCategory.id).where(
            ProductCategory.store_id == store_id,
            ProductCategory.slug == slug,
        )
        if exclude_id is not None:
            query = query.where(ProductCategory.id != exclude_id)
        if db.scalar(query) is None:
            return slug
        suffix = f"-{counter}"
        slug = f"{base_slug[: 80 - len(suffix)]}{suffix}".strip("-")
        counter += 1


def list_categories(db: Session, store_id: int, *, active_only: bool = False) -> list[ProductCategory]:
    stmt = select(ProductCategory).where(ProductCategory.store_id == store_id)
    if active_only:
        stmt = stmt.where(ProductCategory.is_active.is_(True))
    stmt = stmt.order_by(ProductCategory.sort_order, ProductCategory.id)
    return list(db.scalars(stmt).all())


def get_category(db: Session, store_id: int, category_id: int) -> ProductCategory:
    category = db.scalar(
        select(ProductCategory).where(
            ProductCategory.id == category_id,
            ProductCategory.store_id == store_id,
        )
    )
    if category is None:
        raise ServiceError("Category not found", status_code=404)
    return category


def get_category_by_slug(db: Session, store_id: int, slug: str) -> ProductCategory | None:
    return db.scalar(
        select(ProductCategory).where(
            ProductCategory.store_id == store_id,
            ProductCategory.slug == slug,
            ProductCategory.is_active.is_(True),
        )
    )


def create_category(db: Session, store: Store, data: ProductCategoryCreate) -> ProductCategory:
    slug = data.slug.strip() if data.slug else _unique_category_slug(db, store.id, data.name)
    if db.scalar(
        select(ProductCategory.id).where(
            ProductCategory.store_id == store.id,
            ProductCategory.slug == slug,
        )
    ):
        raise ServiceError("این شناسه دسته‌بندی قبلاً استفاده شده است", status_code=409)

    category = ProductCategory(
        store_id=store.id,
        name=data.name.strip(),
        slug=slug,
        sort_order=data.sort_order,
        is_active=data.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session,
    store: Store,
    category_id: int,
    data: ProductCategoryUpdate,
) -> ProductCategory:
    category = get_category(db, store.id, category_id)
    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        category.name = update_data["name"].strip()
    if "sort_order" in update_data and update_data["sort_order"] is not None:
        category.sort_order = update_data["sort_order"]
    if "is_active" in update_data and update_data["is_active"] is not None:
        category.is_active = update_data["is_active"]
    if "slug" in update_data and update_data["slug"] is not None:
        slug = update_data["slug"].strip()
        if db.scalar(
            select(ProductCategory.id).where(
                ProductCategory.store_id == store.id,
                ProductCategory.slug == slug,
                ProductCategory.id != category.id,
            )
        ):
            raise ServiceError("این شناسه دسته‌بندی قبلاً استفاده شده است", status_code=409)
        category.slug = slug

    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, store: Store, category_id: int) -> None:
    category = get_category(db, store.id, category_id)
    product_count = db.scalar(
        select(func.count()).select_from(Product).where(Product.category_id == category.id)
    ) or 0
    if product_count > 0:
        raise ServiceError(
            "این دسته‌بندی به محصولات متصل است. ابتدا محصولات را جابه‌جا یا حذف کنید.",
            status_code=409,
        )
    db.delete(category)
    db.commit()


def resolve_category_id(
    db: Session,
    store_id: int,
    category_id: int | None,
) -> int | None:
    if category_id is None:
        return None
    get_category(db, store_id, category_id)
    return category_id
