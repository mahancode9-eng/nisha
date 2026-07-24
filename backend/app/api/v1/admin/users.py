from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminCustomerDetail,
    AdminCustomerListItem,
    AdminCustomerUpdate,
    AdminSetPasswordRequest,
    AdminUserDetail,
    AdminUserListItem,
    AdminUserUpdate,
)
from app.schemas.pagination import PaginatedResponse, build_paginated_response
from app.services import admin_user_service
from app.services.exceptions import ServiceError

router = APIRouter(tags=["admin-users"])


@router.get("/users", response_model=PaginatedResponse[AdminUserListItem])
def list_users(
    role: UserRole | None = None,
    search: str | None = None,
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AdminUserListItem]:
    items, total = admin_user_service.list_users_paginated(
        db,
        page=page,
        page_size=page_size,
        role=role,
        search=search,
        is_active=is_active,
    )
    return build_paginated_response(items, total, page, page_size)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user(
    user_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserDetail:
    try:
        return admin_user_service.get_user_detail(db, user_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/users/{user_id}", response_model=AdminUserDetail)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserDetail:
    try:
        return admin_user_service.update_user(db, user_id, payload, admin=admin)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/users/{user_id}/password", response_model=AdminUserDetail)
def set_user_password(
    user_id: int,
    payload: AdminSetPasswordRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserDetail:
    try:
        return admin_user_service.set_user_password(
            db,
            user_id,
            password=payload.password,
            admin=admin,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/customers", response_model=PaginatedResponse[AdminCustomerListItem])
def list_customers(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AdminCustomerListItem]:
    items, total = admin_user_service.list_customers_paginated(
        db,
        page=page,
        page_size=page_size,
        search=search,
    )
    return build_paginated_response(items, total, page, page_size)


@router.get("/customers/{customer_id}", response_model=AdminCustomerDetail)
def get_customer(
    customer_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminCustomerDetail:
    try:
        return admin_user_service.get_customer_detail(db, customer_id)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/customers/{customer_id}", response_model=AdminCustomerDetail)
def update_customer(
    customer_id: int,
    payload: AdminCustomerUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminCustomerDetail:
    try:
        return admin_user_service.update_customer(db, customer_id, payload, admin=admin)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/customers/{customer_id}/password", response_model=AdminCustomerDetail)
def set_customer_password(
    customer_id: int,
    payload: AdminSetPasswordRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminCustomerDetail:
    try:
        return admin_user_service.set_customer_password(
            db,
            customer_id,
            password=payload.password,
            admin=admin,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
