import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.store import Store

SLUG_PATTERN = re.compile(r"[^a-z0-9]+")


def slugify(text: str, *, max_length: int = 80) -> str:
    slug = SLUG_PATTERN.sub("-", text.lower().strip())
    slug = slug.strip("-")
    if not slug:
        slug = "store"
    return slug[:max_length].strip("-")


def is_slug_taken(db: Session, slug: str, *, exclude_store_id: int | None = None) -> bool:
    query = select(Store.id).where(Store.slug == slug)
    if exclude_store_id is not None:
        query = query.where(Store.id != exclude_store_id)
    return db.scalar(query) is not None


def generate_unique_store_slug(db: Session, base_text: str) -> str:
    base_slug = slugify(base_text)
    slug = base_slug
    counter = 2

    while db.scalar(select(Store.id).where(Store.slug == slug)) is not None:
        suffix = f"-{counter}"
        slug = f"{base_slug[: 80 - len(suffix)]}{suffix}".strip("-")
        counter += 1

    return slug
