from __future__ import annotations

from sqlalchemy import func, or_, select
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


def _validate_parent(
    db: Session,
    store_id: int,
    parent_id: int | None,
    *,
    category_id: int | None = None,
) -> int | None:
    if parent_id is None:
        return None
    parent = get_category(db, store_id, parent_id)
    if parent.parent_id is not None:
        raise ServiceError("زیردسته نمی‌تونه زیردسته دیگه‌ای داشته باشه؛ فقط یک سطح مجازه.", status_code=400)
    if category_id is not None and parent_id == category_id:
        raise ServiceError("دسته نمی‌تونه والد خودش باشه", status_code=400)
    # Prevent attaching a parent under a node that already has children becoming nested deeper
    if category_id is not None:
        child_count = db.scalar(
            select(func.count()).select_from(ProductCategory).where(ProductCategory.parent_id == category_id)
        ) or 0
        if child_count > 0:
            raise ServiceError("دسته‌ای که زیردسته داره، خودش نمی‌تونه زیردسته بشه.", status_code=400)
    return parent.id


def create_category(db: Session, store: Store, data: ProductCategoryCreate) -> ProductCategory:
    slug = data.slug.strip() if data.slug else _unique_category_slug(db, store.id, data.name)
    if db.scalar(
        select(ProductCategory.id).where(
            ProductCategory.store_id == store.id,
            ProductCategory.slug == slug,
        )
    ):
        raise ServiceError("این شناسه دسته‌بندی قبلاً استفاده شده", status_code=409)

    parent_id = _validate_parent(db, store.id, data.parent_id)

    category = ProductCategory(
        store_id=store.id,
        parent_id=parent_id,
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
            raise ServiceError("این شناسه دسته‌بندی قبلاً استفاده شده", status_code=409)
        category.slug = slug
    if "parent_id" in update_data:
        category.parent_id = _validate_parent(
            db, store.id, update_data["parent_id"], category_id=category.id
        )

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
            "چند محصول تو این دسته هستن. اول اونا رو به دسته دیگه‌ای ببر یا حذف کن.",
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


def category_ids_for_slug_filter(db: Session, store_id: int, category_slug: str) -> list[int]:
    """Resolve a category slug to itself plus direct children (for parent filters)."""
    category = get_category_by_slug(db, store_id, category_slug)
    if category is None:
        return []
    child_ids = list(
        db.scalars(
            select(ProductCategory.id).where(
                ProductCategory.store_id == store_id,
                ProductCategory.parent_id == category.id,
                ProductCategory.is_active.is_(True),
            )
        ).all()
    )
    return [category.id, *child_ids]
