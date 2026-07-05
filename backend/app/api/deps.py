from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.customer_account import CustomerAccount
from app.models.enums import UserRole
from app.models.store import Store
from app.models.user import User

CUSTOMER_ROLE = "CUSTOMER"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
customer_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/customer/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        if payload.get("role") == CUSTOMER_ROLE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="اعتبارنامه قابل تایید نیست",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = int(payload.get("sub", ""))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اعتبارنامه قابل تایید نیست",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = db.scalar(
        select(User)
        .options(selectinload(User.store))
        .where(User.id == user_id)
    )
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اعتبارنامه قابل تایید نیست",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_seller(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SELLER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی فروشنده لازم است",
        )
    return current_user


def get_seller_store(current_user: User = Depends(require_seller)) -> Store:
    if current_user.store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="فروشگاه پیدا نشد",
        )
    return current_user.store


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی مدیر لازم است",
        )
    return current_user


def get_current_customer(
    token: str = Depends(customer_oauth2_scheme),
    db: Session = Depends(get_db),
) -> CustomerAccount:
    try:
        payload = decode_access_token(token)
        if payload.get("role") != CUSTOMER_ROLE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="اعتبارنامه قابل تایید نیست",
                headers={"WWW-Authenticate": "Bearer"},
            )
        customer_id = int(payload.get("sub", ""))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اعتبارنامه قابل تایید نیست",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    customer = db.get(CustomerAccount, customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اعتبارنامه قابل تایید نیست",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return customer
