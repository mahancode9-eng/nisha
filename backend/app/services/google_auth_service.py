"""Verify Google ID tokens and map them to customer / seller accounts."""

from __future__ import annotations

from datetime import UTC, datetime

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.customer_account import CustomerAccount
from app.models.enums import UserRole
from app.models.store import Store
from app.models.user import User
from app.services.auth_service import (
    AuthError,
    get_user_by_email,
    get_user_by_google_sub,
    normalize_email,
)
from app.services.customer_auth_service import get_customer_by_email, get_customer_by_google_sub
from app.utils.slug import generate_unique_store_slug


def verify_google_id_token(token: str) -> dict:
    client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
    if not client_id:
        raise AuthError(
            "ورود با گوگل فعلاً فعال نیست. از ایمیل و رمز استفاده کن.",
            status_code=503,
        )
    try:
        info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=client_id,
            clock_skew_in_seconds=10,
        )
    except ValueError as exc:
        raise AuthError("ورود با گوگل تایید نشد. دوباره امتحان کن.", status_code=401) from exc

    if info.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise AuthError("ورود با گوگل تایید نشد. دوباره امتحان کن.", status_code=401)
    if not info.get("email") or not info.get("email_verified"):
        raise AuthError(
            "گوگل ایمیل تایید‌شده نداد. حساب دیگه‌ای امتحان کن یا با ایمیل ثبت‌نام کن.",
            status_code=400,
        )
    if not info.get("sub"):
        raise AuthError("ورود با گوگل تایید نشد. دوباره امتحان کن.", status_code=401)
    return info


def authenticate_or_create_customer_with_google(db: Session, *, id_token_str: str) -> CustomerAccount:
    info = verify_google_id_token(id_token_str)
    google_sub = str(info["sub"])
    email = normalize_email(str(info["email"]))
    full_name = (info.get("name") or "").strip() or email.split("@")[0]

    customer = get_customer_by_google_sub(db, google_sub)
    if customer is not None:
        if customer.email_verified_at is None:
            customer.email_verified_at = datetime.now(UTC)
            db.commit()
            db.refresh(customer)
        return customer

    existing = get_customer_by_email(db, email)
    if existing is not None:
        if existing.google_sub and existing.google_sub != google_sub:
            raise AuthError(
                "این ایمیل به حساب گوگل دیگه‌ای وصله. با همون حساب وارد شو.",
                status_code=409,
            )
        existing.google_sub = google_sub
        if existing.email_verified_at is None:
            existing.email_verified_at = datetime.now(UTC)
        if not (existing.full_name or "").strip():
            existing.full_name = full_name
        db.commit()
        db.refresh(existing)
        return existing

    customer = CustomerAccount(
        email=email,
        phone=None,
        password_hash=None,
        google_sub=google_sub,
        full_name=full_name,
        email_verified_at=datetime.now(UTC),
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AuthError("این حساب از قبل هست. وارد شو.", status_code=409) from exc
    db.refresh(customer)
    return customer


def authenticate_or_create_seller_with_google(db: Session, *, id_token_str: str) -> User:
    info = verify_google_id_token(id_token_str)
    google_sub = str(info["sub"])
    email = normalize_email(str(info["email"]))
    full_name = (info.get("name") or "").strip() or email.split("@")[0]

    user = get_user_by_google_sub(db, google_sub)
    if user is not None:
        if user.role != UserRole.SELLER:
            raise AuthError(
                "این حساب گوگل برای ورود فروشنده نیست. از صفحه ورود مربوط به نقش خودت استفاده کن.",
                status_code=403,
            )
        if not user.is_active:
            raise AuthError("این حساب غیرفعاله. با پشتیبانی تماس بگیر.", status_code=403)
        if user.email_verified_at is None:
            user.email_verified_at = datetime.now(UTC)
            db.commit()
            db.refresh(user)
        return user

    existing = get_user_by_email(db, email)
    if existing is not None:
        if existing.role != UserRole.SELLER:
            raise AuthError(
                "این ایمیل برای نقش دیگه‌ای ثبت شده و نمی‌تونه با گوگل به‌عنوان فروشنده وارد بشه.",
                status_code=403,
            )
        if existing.google_sub and existing.google_sub != google_sub:
            raise AuthError(
                "این ایمیل به حساب گوگل دیگه‌ای وصله. با همون حساب وارد شو.",
                status_code=409,
            )
        if not existing.is_active:
            raise AuthError("این حساب غیرفعاله. با پشتیبانی تماس بگیر.", status_code=403)
        existing.google_sub = google_sub
        if existing.email_verified_at is None:
            existing.email_verified_at = datetime.now(UTC)
        if not (existing.full_name or "").strip():
            existing.full_name = full_name
        db.commit()
        return db.scalar(
            select(User)
            .options(selectinload(User.store))
            .where(User.id == existing.id)
        )

    user = User(
        email=email,
        password_hash=None,
        google_sub=google_sub,
        full_name=full_name,
        role=UserRole.SELLER,
        is_active=True,
        email_verified_at=datetime.now(UTC),
    )
    db.add(user)
    try:
        db.flush()
        store = Store(
            owner_id=user.id,
            name=f"{user.full_name}'s Store",
            slug=generate_unique_store_slug(db, full_name or email.split("@")[0]),
            is_active=True,
            guest_checkout_enabled=False,
        )
        db.add(store)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AuthError("این حساب از قبل هست. وارد شو.", status_code=409) from exc

    return db.scalar(
        select(User)
        .options(selectinload(User.store))
        .where(User.id == user.id)
    )
