from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.models.customer_account import CustomerAccount
from app.models.enums import UserRole
from app.models.order import Order
from app.models.user import User
from app.schemas.admin import (
    AdminCustomerDetail,
    AdminCustomerListItem,
    AdminCustomerUpdate,
    AdminUserDetail,
    AdminUserListItem,
    AdminUserUpdate,
)
from app.services.admin_audit_service import record_admin_action
from app.services.auth_service import normalize_email
from app.services.exceptions import ServiceError


def _user_list_item(user: User) -> AdminUserListItem:
    store_slug = user.store.slug if user.store else None
    return AdminUserListItem(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        store_slug=store_slug,
        created_at=user.created_at,
    )


def _count_active_admins(db: Session, *, exclude_user_id: int | None = None) -> int:
    stmt = select(func.count()).select_from(User).where(
        User.role == UserRole.ADMIN,
        User.is_active.is_(True),
    )
    if exclude_user_id is not None:
        stmt = stmt.where(User.id != exclude_user_id)
    return int(db.scalar(stmt) or 0)


def list_users_paginated(
    db: Session,
    *,
    page: int,
    page_size: int,
    role: UserRole | None = None,
    search: str | None = None,
    is_active: bool | None = None,
) -> tuple[list[AdminUserListItem], int]:
    stmt = select(User).options(selectinload(User.store))
    count_stmt = select(func.count()).select_from(User)

    if role is not None:
        stmt = stmt.where(User.role == role)
        count_stmt = count_stmt.where(User.role == role)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
        count_stmt = count_stmt.where(User.is_active == is_active)
    if search:
        term = f"%{search.strip()}%"
        filter_expr = or_(User.email.ilike(term), User.full_name.ilike(term))
        stmt = stmt.where(filter_expr)
        count_stmt = count_stmt.where(filter_expr)

    total = int(db.scalar(count_stmt) or 0)
    offset = (page - 1) * page_size
    users = list(db.scalars(stmt.order_by(User.created_at.desc()).offset(offset).limit(page_size)).all())
    return [_user_list_item(user) for user in users], total


def get_user_detail(db: Session, user_id: int) -> AdminUserDetail:
    user = db.scalar(
        select(User).options(selectinload(User.store)).where(User.id == user_id)
    )
    if user is None:
        raise ServiceError("User not found", status_code=404)
    item = _user_list_item(user)
    return AdminUserDetail(**item.model_dump(), email_verified_at=user.email_verified_at)


def update_user(
    db: Session,
    user_id: int,
    payload: AdminUserUpdate,
    *,
    admin: User,
) -> AdminUserDetail:
    user = db.scalar(select(User).options(selectinload(User.store)).where(User.id == user_id))
    if user is None:
        raise ServiceError("User not found", status_code=404)

    update_data = payload.model_dump(exclude_unset=True)

    if user.id == admin.id:
        if update_data.get("is_active") is False:
            raise ServiceError("نمی‌توانید حساب خود را غیرفعال کنید", status_code=422)
        if update_data.get("role") is not None and update_data["role"] != UserRole.ADMIN:
            raise ServiceError("نمی‌توانید نقش خود را تغییر دهید", status_code=422)

    if user.role == UserRole.ADMIN and update_data.get("is_active") is False:
        if _count_active_admins(db, exclude_user_id=user.id) == 0:
            raise ServiceError("حداقل یک ادمین فعال باید باقی بماند", status_code=422)

    if update_data.get("role") is not None and user.role == UserRole.ADMIN and update_data["role"] != UserRole.ADMIN:
        if _count_active_admins(db, exclude_user_id=user.id) == 0 and user.is_active:
            raise ServiceError("حداقل یک ادمین فعال باید باقی بماند", status_code=422)

    for field, value in update_data.items():
        setattr(user, field, value)

    record_admin_action(
        db,
        admin=admin,
        entity_type="user",
        entity_id=user.id,
        action="UPDATE",
        entity_label=user.email,
        details=update_data,
    )
    db.commit()
    db.refresh(user)
    return get_user_detail(db, user.id)


def set_user_password(
    db: Session,
    user_id: int,
    *,
    password: str,
    admin: User,
) -> AdminUserDetail:
    user = db.get(User, user_id)
    if user is None:
        raise ServiceError("User not found", status_code=404)

    user.password_hash = hash_password(password)
    record_admin_action(
        db,
        admin=admin,
        entity_type="user",
        entity_id=user.id,
        action="PASSWORD_RESET",
        entity_label=user.email,
    )
    db.commit()
    return get_user_detail(db, user.id)


def _customer_list_item(db: Session, customer: CustomerAccount) -> AdminCustomerListItem:
    order_count = int(
        db.scalar(select(func.count()).select_from(Order).where(Order.customer_id == customer.id)) or 0
    )
    return AdminCustomerListItem(
        id=customer.id,
        email=customer.email,
        phone=customer.phone,
        full_name=customer.full_name,
        order_count=order_count,
        email_verified_at=customer.email_verified_at,
        created_at=customer.created_at,
    )


def list_customers_paginated(
    db: Session,
    *,
    page: int,
    page_size: int,
    search: str | None = None,
) -> tuple[list[AdminCustomerListItem], int]:
    stmt = select(CustomerAccount)
    count_stmt = select(func.count()).select_from(CustomerAccount)

    if search:
        term = f"%{search.strip()}%"
        filter_expr = or_(
            CustomerAccount.full_name.ilike(term),
            CustomerAccount.email.ilike(term),
            CustomerAccount.phone.ilike(term),
        )
        stmt = stmt.where(filter_expr)
        count_stmt = count_stmt.where(filter_expr)

    total = int(db.scalar(count_stmt) or 0)
    offset = (page - 1) * page_size
    customers = list(db.scalars(stmt.order_by(CustomerAccount.created_at.desc()).offset(offset).limit(page_size)).all())
    return [_customer_list_item(db, customer) for customer in customers], total


def get_customer_detail(db: Session, customer_id: int) -> AdminCustomerDetail:
    customer = db.get(CustomerAccount, customer_id)
    if customer is None:
        raise ServiceError("Customer not found", status_code=404)
    item = _customer_list_item(db, customer)
    return AdminCustomerDetail(**item.model_dump(), postal_code=customer.postal_code)


def update_customer(
    db: Session,
    customer_id: int,
    payload: AdminCustomerUpdate,
    *,
    admin: User,
) -> AdminCustomerDetail:
    customer = db.get(CustomerAccount, customer_id)
    if customer is None:
        raise ServiceError("Customer not found", status_code=404)

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"]:
        update_data["email"] = normalize_email(update_data["email"])

    for field, value in update_data.items():
        setattr(customer, field, value)

    record_admin_action(
        db,
        admin=admin,
        entity_type="customer",
        entity_id=customer.id,
        action="UPDATE",
        entity_label=customer.email or customer.phone or customer.full_name,
        details=update_data,
    )
    db.commit()
    db.refresh(customer)
    return get_customer_detail(db, customer.id)


def set_customer_password(
    db: Session,
    customer_id: int,
    *,
    password: str,
    admin: User,
) -> AdminCustomerDetail:
    customer = db.get(CustomerAccount, customer_id)
    if customer is None:
        raise ServiceError("Customer not found", status_code=404)

    customer.password_hash = hash_password(password)
    record_admin_action(
        db,
        admin=admin,
        entity_type="customer",
        entity_id=customer.id,
        action="PASSWORD_RESET",
        entity_label=customer.email or customer.phone or customer.full_name,
    )
    db.commit()
    return get_customer_detail(db, customer.id)
