from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class StoreCategoryOption:
    label: str
    slug: str
    query: str
    icon_key: str | None
    keywords: tuple[str, ...]


STORE_CATEGORIES: tuple[StoreCategoryOption, ...] = (
    StoreCategoryOption(
        "مد و پوشاک",
        "fashion",
        "fashion clothing apparel",
        "shirt",
        ("shirt", "dress", "hoodie", "jacket", "polo", "fashion", "clothes"),
    ),
    StoreCategoryOption(
        "زیبایی",
        "beauty",
        "beauty skincare makeup",
        "sparkles",
        ("beauty", "makeup", "skincare", "cosmetic", "serum", "cream"),
    ),
    StoreCategoryOption(
        "الکترونیک",
        "electronics",
        "electronics gadgets tech",
        "cpu",
        ("phone", "laptop", "tablet", "earbud", "charger", "tech", "electronics"),
    ),
    StoreCategoryOption(
        "خانه و دکور",
        "home",
        "home decor household",
        "home",
        ("home", "kitchen", "decor", "household", "furniture", "room"),
    ),
    StoreCategoryOption(
        "دیجیتال",
        "digital",
        "digital services downloads",
        "download",
        ("digital", "ebook", "course", "template", "download", "service"),
    ),
    StoreCategoryOption(
        "اکسسوری",
        "accessories",
        "accessories gifts add-ons",
        "box",
        ("accessory", "bag", "case", "wallet", "gift", "accessories"),
    ),
)

OTHER_CATEGORY = StoreCategoryOption("سایر", "other", "other", None, ())


def list_store_categories() -> list[StoreCategoryOption]:
    return [*STORE_CATEGORIES, OTHER_CATEGORY]


def get_store_category(slug: str | None) -> StoreCategoryOption | None:
    if not slug:
        return None

    normalized = slug.strip().lower()
    for category in STORE_CATEGORIES:
        if category.slug == normalized:
            return category
    if normalized == OTHER_CATEGORY.slug:
        return OTHER_CATEGORY
    return None
