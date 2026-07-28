from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.product_category import (
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCategoryUpdate,
)
from app.services import product_category_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/categories", tags=["seller-categories"])


@router.get("", response_model=list[ProductCategoryResponse])
def list_categories(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[ProductCategoryResponse]:
    categories = product_category_service.list_categories(db, store.id)
    return [ProductCategoryResponse.model_validate(category) for category in categories]


@router.post("", response_model=ProductCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: ProductCategoryCreate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ProductCategoryResponse:
    try:
        category = product_category_service.create_category(db, store, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return ProductCategoryResponse.model_validate(category)


@router.put("/{category_id}", response_model=ProductCategoryResponse)
def update_category(
    category_id: int,
    payload: ProductCategoryUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> ProductCategoryResponse:
    try:
        category = product_category_service.update_category(db, store, category_id, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return ProductCategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        product_category_service.delete_category(db, store, category_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
