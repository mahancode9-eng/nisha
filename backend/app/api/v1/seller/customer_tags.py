from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_seller_store
from app.api.service_http import raise_service_error
from app.db.session import get_db
from app.models.store import Store
from app.schemas.customer_tag import (
    CustomerTagAssignRequest,
    CustomerTagCreate,
    CustomerTagResponse,
    CustomerTagUpdate,
)
from app.services import customer_tag_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/customer-tags", tags=["seller-customer-tags"])


@router.get("", response_model=list[CustomerTagResponse])
def list_tags(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[CustomerTagResponse]:
    tags = customer_tag_service.list_tags(db, store)
    return [CustomerTagResponse.model_validate(tag) for tag in tags]


@router.post("", response_model=CustomerTagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: CustomerTagCreate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> CustomerTagResponse:
    try:
        tag = customer_tag_service.create_tag(db, store, payload)
    except ServiceError as exc:
        raise_service_error(exc)
    return CustomerTagResponse.model_validate(tag)


@router.put("/{tag_id}", response_model=CustomerTagResponse)
def update_tag(
    tag_id: int,
    payload: CustomerTagUpdate,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> CustomerTagResponse:
    try:
        tag = customer_tag_service.update_tag(db, store, tag_id, payload)
    except ServiceError as exc:
        raise_service_error(exc)
    return CustomerTagResponse.model_validate(tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> Response:
    try:
        customer_tag_service.delete_tag(db, store, tag_id)
    except ServiceError as exc:
        raise_service_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put(
    "/customers/{customer_key:path}",
    response_model=list[CustomerTagResponse],
)
def assign_customer_tags(
    customer_key: str,
    payload: CustomerTagAssignRequest,
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[CustomerTagResponse]:
    try:
        tags = customer_tag_service.set_customer_tags(
            db,
            store,
            customer_key,
            payload.tag_ids,
        )
    except ServiceError as exc:
        raise_service_error(exc)
    return [CustomerTagResponse.model_validate(tag) for tag in tags]
