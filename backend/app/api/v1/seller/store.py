from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.db.session import get_db
from app.models.store import Store
from app.schemas.store import (
    StoreResponse,
    StoreSocialLinkInput,
    StoreSocialLinkReorderRequest,
    StoreSocialLinkResponse,
    StoreUpdate,
)
from app.services import store_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/store", tags=["seller-store"])


@router.get("", response_model=StoreResponse)
def get_my_store(store: Store = Depends(get_seller_store)) -> Store:
    return store_service.get_store(store)


@router.put("", response_model=StoreResponse)
def update_my_store(
    payload: StoreUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Store:
    try:
        return store_service.update_store(db, store, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/social-links", response_model=list[StoreSocialLinkResponse])
def list_social_links(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[StoreSocialLinkResponse]:
    return [StoreSocialLinkResponse.model_validate(link) for link in store_service.list_social_links(db, store)]


@router.post("/social-links", response_model=StoreSocialLinkResponse, status_code=status.HTTP_201_CREATED)
def create_social_link(
    payload: StoreSocialLinkInput,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> StoreSocialLinkResponse:
    try:
        link = store_service.create_social_link(db, store, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return StoreSocialLinkResponse.model_validate(link)


@router.put("/social-links/{link_id}", response_model=StoreSocialLinkResponse)
def update_social_link(
    link_id: int,
    payload: StoreSocialLinkInput,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> StoreSocialLinkResponse:
    try:
        link = store_service.update_social_link(db, store, link_id, payload)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return StoreSocialLinkResponse.model_validate(link)


@router.delete("/social-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_link(
    link_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        store_service.delete_social_link(db, store, link_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/social-links/reorder", response_model=list[StoreSocialLinkResponse])
def reorder_social_links(
    payload: StoreSocialLinkReorderRequest,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[StoreSocialLinkResponse]:
    try:
        links = store_service.reorder_social_links(db, store, payload.ordered_ids)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    return [StoreSocialLinkResponse.model_validate(link) for link in links]
