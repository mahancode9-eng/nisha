import re

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.customer_account import CustomerAccount
from app.services.auth_service import AuthError, normalize_email


def normalize_phone(phone: str) -> str:
    return re.sub(r"\s+", "", phone.strip())


def get_customer_by_email(db: Session, email: str) -> CustomerAccount | None:
    return db.scalar(
        select(CustomerAccount).where(CustomerAccount.email == normalize_email(email))
    )


def get_customer_by_phone(db: Session, phone: str) -> CustomerAccount | None:
    return db.scalar(
        select(CustomerAccount).where(CustomerAccount.phone == normalize_phone(phone))
    )


def register_customer(
    db: Session,
    *,
    email: str | None,
    phone: str | None,
    password: str,
    full_name: str,
    postal_code: str | None = None,
) -> CustomerAccount:
    normalized_email = normalize_email(email) if email else None
    normalized_phone = normalize_phone(phone) if phone else None

    if not normalized_email and not normalized_phone:
        raise AuthError("حداقل یکی از ایمیل یا تلفن الزامی است", status_code=422)

    if normalized_email and get_customer_by_email(db, normalized_email) is not None:
        raise AuthError("ایمیل قبلا ثبت شده است", status_code=409)
    if normalized_phone and get_customer_by_phone(db, normalized_phone) is not None:
        raise AuthError("تلفن قبلا ثبت شده است", status_code=409)

    customer = CustomerAccount(
        email=normalized_email,
        phone=normalized_phone,
        postal_code=postal_code.strip() if postal_code else None,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AuthError("این حساب قبلا ایجاد شده است", status_code=409) from exc

    db.refresh(customer)
    return customer


def authenticate_customer(db: Session, *, login: str, password: str) -> CustomerAccount:
    login = login.strip()
    if "@" in login:
        customer = get_customer_by_email(db, login)
    else:
        customer = get_customer_by_phone(db, login)

    if customer is None or not verify_password(password, customer.password_hash):
        raise AuthError("ورود یا رمز عبور نامعتبر است", status_code=401)

    return customer
