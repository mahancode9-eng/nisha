from __future__ import annotations

import json

from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.product import OrderItemFieldValue, Product, ProductFieldType, ProductFormField, ProductImage, ProductVariant
from app.models.store import Store
from app.schemas.product import (
    MAX_PRODUCT_IMAGES,
    ProductCreate,
    ProductFormFieldInput,
    ProductFormFieldReorderRequest,
    ProductImageInput,
    ProductImageReorderRequest,
    ProductUpdate,
    ProductVariantInput,
)
from app.services.exceptions import ServiceError

MAX_IMAGES_MESSAGE = "حداکثر ۸ تصویر برای هر محصول مجاز است"


def _serialize_json(value) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


def _deserialize_json(raw: str | None):
    if raw is None or raw == "":
        return None
    return json.loads(raw)


def _coerce_image_input(image: ProductImageInput | str | dict) -> ProductImageInput | str:
    if isinstance(image, (ProductImageInput, str)):
        return image
    return ProductImageInput.model_validate(image)


def _coerce_form_field_input(field: ProductFormFieldInput | dict) -> ProductFormFieldInput:
    if isinstance(field, ProductFormFieldInput):
        return field
    return ProductFormFieldInput.model_validate(field)


def _coerce_variant_input(variant: ProductVariantInput | dict) -> ProductVariantInput:
    if isinstance(variant, ProductVariantInput):
        return variant
    return ProductVariantInput.model_validate(variant)


def _commit_or_raise(db: Session, message: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ServiceError(message, status_code=409) from exc


def _attach_images(
    db: Session,
    product: Product,
    images: list[ProductImageInput] | list[str] | list[dict],
) -> None:
    if not images:
        return

    coerced_images = [_coerce_image_input(image) for image in images]
    if len(coerced_images) > MAX_PRODUCT_IMAGES:
        raise ServiceError(MAX_IMAGES_MESSAGE, status_code=422)

    if isinstance(coerced_images[0], str):  # legacy compatibility
        for index, image_url in enumerate(coerced_images):
            db.add(
                ProductImage(
                    product_id=product.id,
                    image_url=image_url,
                    thumbnail_url=None,
                    alt_text=None,
                    sort_order=index,
                    mime_type=None,
                    width=None,
                    height=None,
                )
            )
        return

    for index, image in enumerate(coerced_images):
        db.add(
            ProductImage(
                product_id=product.id,
                image_url=image.image_url,
                thumbnail_url=image.thumbnail_url,
                alt_text=image.alt_text,
                sort_order=image.sort_order if image.sort_order is not None else index,
                mime_type=image.mime_type,
                width=image.width,
                height=image.height,
            )
        )


def _replace_images(db: Session, product: Product, images: list[ProductImageInput] | list[str] | list[dict]) -> None:
    for image in list(product.images):
        db.delete(image)
    db.flush()
    _attach_images(db, product, images)


def _attach_form_fields(db: Session, product: Product, fields: list[ProductFormFieldInput] | list[dict]) -> None:
    coerced_fields = [_coerce_form_field_input(field) for field in fields]
    for index, field in enumerate(coerced_fields):
        db.add(
            ProductFormField(
                product_id=product.id,
                field_key=field.field_key,
                label=field.label,
                field_type=field.field_type,
                sort_order=field.sort_order if field.sort_order is not None else index,
                is_required=field.is_required,
                placeholder=field.placeholder,
                help_text=field.help_text,
                validation_json=_serialize_json(field.validation),
                options_json=_serialize_json([option.model_dump() for option in field.options] if field.options else None),
            )
        )


def _replace_form_fields(db: Session, product: Product, fields: list[ProductFormFieldInput] | list[dict]) -> None:
    for field in list(product.form_fields):
        db.delete(field)
    db.flush()
    _attach_form_fields(db, product, fields)


def _attach_variants(
    db: Session,
    product: Product,
    variants: list[ProductVariantInput] | list[dict],
) -> None:
    """Create variant rows for a product (roadmap task 16).

    When at least one active variant exists, the parent product's
    ``stock_quantity`` is kept in sync as the sum of active variant stocks
    so storefront listing and the in-stock filter stay correct.
    """
    coerced = [_coerce_variant_input(variant) for variant in variants]
    for index, variant in enumerate(coerced):
        db.add(
            ProductVariant(
                product_id=product.id,
                name=variant.name,
                price_override=variant.price_override,
                stock_quantity=variant.stock_quantity,
                sort_order=variant.sort_order if variant.sort_order is not None else index,
                is_active=variant.is_active,
            )
        )
    if any(variant.is_active for variant in coerced):
        product.stock_quantity = sum(
            variant.stock_quantity for variant in coerced if variant.is_active
        )


def _replace_variants(
    db: Session,
    product: Product,
    variants: list[ProductVariantInput] | list[dict],
) -> None:
    for variant in list(product.variants):
        db.delete(variant)
    db.flush()
    _attach_variants(db, product, variants)


def _products_base_query(store: Store):
    return (
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.form_fields),
            selectinload(Product.variants),
        )
        .where(Product.store_id == store.id)
    )


def list_products(db: Session, store: Store) -> list[Product]:
    return list(db.scalars(_products_base_query(store).order_by(Product.id)).all())


def list_products_paginated(
    db: Session,
    store: Store,
    *,
    page: int,
    page_size: int,
) -> tuple[list[Product], int]:
    base = select(Product).where(Product.store_id == store.id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    offset = (page - 1) * page_size
    items = list(
        db.scalars(_products_base_query(store).order_by(Product.id).offset(offset).limit(page_size)).all()
    )
    return items, total


def get_product(db: Session, store: Store, product_id: int) -> Product:
    product = db.scalar(
        select(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.form_fields),
            selectinload(Product.variants),
        )
        .where(Product.id == product_id, Product.store_id == store.id)
    )
    if product is None:
        raise ServiceError("Product not found", status_code=404)
    return product


def create_product(db: Session, store: Store, data: ProductCreate) -> Product:
    product = Product(
        store_id=store.id,
        title=data.title,
        description=data.description,
        price=data.price,
        stock_quantity=data.stock_quantity,
        is_active=data.is_active,
        video_url=data.video_url,
        video_mime_type=data.video_mime_type,
    )
    db.add(product)
    db.flush()

    if data.images is not None:
        _attach_images(db, product, data.images)
    elif data.image_urls:
        _attach_images(db, product, data.image_urls)

    if data.form_fields:
        _attach_form_fields(db, product, data.form_fields)

    if data.variants:
        _attach_variants(db, product, data.variants)

    _commit_or_raise(db, "Could not create product")
    db.refresh(product)
    return get_product(db, store, product.id)


def update_product(
    db: Session,
    store: Store,
    product_id: int,
    data: ProductUpdate,
) -> Product:
    product = get_product(db, store, product_id)
    update_data = data.model_dump(exclude_unset=True)

    image_urls = update_data.pop("image_urls", None)
    images = update_data.pop("images", None)
    form_fields = update_data.pop("form_fields", None)
    variants = update_data.pop("variants", None)
    for field, value in update_data.items():
        setattr(product, field, value)

    if images is not None:
        _replace_images(db, product, images)
    elif image_urls is not None:
        _replace_images(db, product, image_urls)

    if form_fields is not None:
        _replace_form_fields(db, product, form_fields)

    if variants is not None:
        _replace_variants(db, product, variants)

    _commit_or_raise(db, "Could not update product")
    return get_product(db, store, product_id)


def delete_product(db: Session, store: Store, product_id: int) -> None:
    product = get_product(db, store, product_id)
    db.delete(product)
    db.commit()


def build_form_field_snapshot(field: ProductFormField) -> dict:
    return {
        "field_key": field.field_key,
        "label": field.label,
        "field_type": field.field_type.value if hasattr(field.field_type, "value") else str(field.field_type),
        "sort_order": field.sort_order,
        "is_required": field.is_required,
        "placeholder": field.placeholder,
        "help_text": field.help_text,
        "validation": _deserialize_json(field.validation_json),
        "options": _deserialize_json(field.options_json),
    }


def build_product_image_payload(image: ProductImage) -> dict:
    return {
        "image_url": image.image_url,
        "thumbnail_url": image.thumbnail_url,
        "alt_text": image.alt_text,
        "sort_order": image.sort_order,
        "mime_type": image.mime_type,
        "width": image.width,
        "height": image.height,
    }


def _get_product_image(db: Session, store: Store, product_id: int, image_id: int) -> ProductImage:
    image = db.get(ProductImage, image_id)
    if image is None or image.product_id != product_id:
        raise ServiceError("Image not found", status_code=404)
    product = get_product(db, store, product_id)
    if image.product_id != product.id:
        raise ServiceError("Image not found", status_code=404)
    return image


def _get_form_field(db: Session, store: Store, product_id: int, field_id: int) -> ProductFormField:
    field = db.get(ProductFormField, field_id)
    if field is None or field.product_id != product_id:
        raise ServiceError("Field not found", status_code=404)
    product = get_product(db, store, product_id)
    if field.product_id != product.id:
        raise ServiceError("Field not found", status_code=404)
    return field


def create_product_image(db: Session, store: Store, product_id: int, data: ProductImageInput) -> ProductImage:
    product = get_product(db, store, product_id)
    if len(product.images) >= MAX_PRODUCT_IMAGES:
        raise ServiceError(MAX_IMAGES_MESSAGE, status_code=422)
    image = ProductImage(
        product_id=product.id,
        image_url=data.image_url,
        thumbnail_url=data.thumbnail_url,
        alt_text=data.alt_text,
        sort_order=data.sort_order,
        mime_type=data.mime_type,
        width=data.width,
        height=data.height,
    )
    db.add(image)
    _commit_or_raise(db, "Could not create image")
    db.refresh(image)
    return image


def update_product_image(db: Session, store: Store, product_id: int, image_id: int, data: ProductImageInput) -> ProductImage:
    image = _get_product_image(db, store, product_id, image_id)
    for field, value in data.model_dump().items():
        setattr(image, field, value)
    _commit_or_raise(db, "Could not update image")
    db.refresh(image)
    return image


def delete_product_image(db: Session, store: Store, product_id: int, image_id: int) -> None:
    image = _get_product_image(db, store, product_id, image_id)
    db.delete(image)
    db.commit()


def reorder_product_images(
    db: Session,
    store: Store,
    product_id: int,
    payload: ProductImageReorderRequest,
) -> list[ProductImage]:
    product = get_product(db, store, product_id)
    images = list(product.images)
    if len(images) != len(payload.ordered_ids) or {image.id for image in images} != set(payload.ordered_ids):
        raise ServiceError("Invalid image order", status_code=422)
    by_id = {image.id: image for image in images}
    for index, image_id in enumerate(payload.ordered_ids):
        by_id[image_id].sort_order = index
    _commit_or_raise(db, "Could not reorder images")
    return list(
        db.scalars(
            select(ProductImage).where(ProductImage.product_id == product.id).order_by(ProductImage.sort_order, ProductImage.id)
        ).all()
    )


def create_product_form_field(
    db: Session,
    store: Store,
    product_id: int,
    data: ProductFormFieldInput,
) -> ProductFormField:
    product = get_product(db, store, product_id)
    field = ProductFormField(
        product_id=product.id,
        field_key=data.field_key,
        label=data.label,
        field_type=data.field_type,
        sort_order=data.sort_order,
        is_required=data.is_required,
        placeholder=data.placeholder,
        help_text=data.help_text,
        validation_json=_serialize_json(data.validation),
        options_json=_serialize_json([option.model_dump() for option in data.options] if data.options else None),
    )
    db.add(field)
    _commit_or_raise(db, "Could not create field")
    db.refresh(field)
    return field


def update_product_form_field(
    db: Session,
    store: Store,
    product_id: int,
    field_id: int,
    data: ProductFormFieldInput,
) -> ProductFormField:
    field = _get_form_field(db, store, product_id, field_id)
    field.field_key = data.field_key
    field.label = data.label
    field.field_type = data.field_type
    field.sort_order = data.sort_order
    field.is_required = data.is_required
    field.placeholder = data.placeholder
    field.help_text = data.help_text
    field.validation_json = _serialize_json(data.validation)
    field.options_json = _serialize_json([option.model_dump() for option in data.options] if data.options else None)
    _commit_or_raise(db, "Could not update field")
    db.refresh(field)
    return field


def delete_product_form_field(db: Session, store: Store, product_id: int, field_id: int) -> None:
    field = _get_form_field(db, store, product_id, field_id)
    db.delete(field)
    db.commit()


def reorder_product_form_fields(
    db: Session,
    store: Store,
    product_id: int,
    payload: ProductFormFieldReorderRequest,
) -> list[ProductFormField]:
    product = get_product(db, store, product_id)
    fields = list(product.form_fields)
    if len(fields) != len(payload.ordered_ids) or {field.id for field in fields} != set(payload.ordered_ids):
        raise ServiceError("Invalid field order", status_code=422)
    by_id = {field.id: field for field in fields}
    for index, field_id in enumerate(payload.ordered_ids):
        by_id[field_id].sort_order = index
    _commit_or_raise(db, "Could not reorder fields")
    return list(
        db.scalars(
            select(ProductFormField)
            .where(ProductFormField.product_id == product.id)
            .order_by(ProductFormField.sort_order, ProductFormField.id)
        ).all()
    )
