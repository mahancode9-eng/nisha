from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_seller_store
from app.api.service_http import raise_service_error
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.store_team import (
    CustomDomainUpdate,
    StoreActionLogResponse,
    StoreMemberCreate,
    StoreMemberResponse,
)
from app.schemas.store import StoreResponse
from app.services import custom_domain_service, store_team_service
from app.services.exceptions import ServiceError

router = APIRouter(prefix="/team", tags=["seller-team"])


@router.get("/members", response_model=list[StoreMemberResponse])
def list_members(
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[StoreMemberResponse]:
    return [
        StoreMemberResponse.model_validate(member)
        for member in store_team_service.list_members(db, store)
    ]


@router.post(
    "/members",
    response_model=StoreMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_member(
    payload: StoreMemberCreate,
    store: Store = Depends(get_seller_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StoreMemberResponse:
    try:
        member = store_team_service.invite_member(db, store, current_user, payload)
    except ServiceError as exc:
        raise_service_error(exc)
    return StoreMemberResponse.model_validate(member)


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    member_id: int,
    store: Store = Depends(get_seller_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        store_team_service.remove_member(db, store, current_user, member_id)
    except ServiceError as exc:
        raise_service_error(exc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/audit-logs", response_model=list[StoreActionLogResponse])
def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    store: Store = Depends(get_seller_store),
    db: Session = Depends(get_db),
) -> list[StoreActionLogResponse]:
    return [
        StoreActionLogResponse.model_validate(row)
        for row in store_team_service.list_action_logs(db, store, limit=limit)
    ]


@router.put("/domain", response_model=StoreResponse)
def set_domain(
    payload: CustomDomainUpdate,
    store: Store = Depends(get_seller_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StoreResponse:
    try:
        updated = custom_domain_service.set_custom_domain(
            db,
            store,
            current_user,
            payload.custom_domain,
        )
    except ServiceError as exc:
        raise_service_error(exc)
    return StoreResponse.model_validate(updated)


@router.post("/domain/verify", response_model=StoreResponse)
def verify_domain(
    store: Store = Depends(get_seller_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StoreResponse:
    try:
        updated = custom_domain_service.verify_custom_domain(db, store, current_user)
    except ServiceError as exc:
        raise_service_error(exc)
    return StoreResponse.model_validate(updated)
