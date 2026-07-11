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

    if normalized_email:
        existing = get_customer_by_email(db, normalized_email)
        if existing is not None:
            if existing.email_verified_at is not None:
                raise AuthError("ایمیل قبلا ثبت شده است", status_code=409)
            if normalized_phone:
                phone_owner = get_customer_by_phone(db, normalized_phone)
                if phone_owner is not None and phone_owner.id != existing.id:
                    raise AuthError("تلفن قبلا ثبت شده است", status_code=409)
            existing.full_name = full_name.strip()
            existing.password_hash = hash_password(password)
            existing.postal_code = postal_code.strip() if postal_code else None
            if normalized_phone:
                existing.phone = normalized_phone
            try:
                from app.models.enums import VerificationAccountKind
                from app.services.email_verification_service import issue_verification

                db.flush()
                issue_verification(
                    db,
                    account_kind=VerificationAccountKind.CUSTOMER,
                    account_id=existing.id,
                    email=normalized_email,
                    full_name=existing.full_name,
                )
                db.commit()
            except IntegrityError as exc:
                db.rollback()
                raise AuthError("این حساب قبلا ایجاد شده است", status_code=409) from exc
            db.refresh(existing)
            return existing

    if normalized_phone and get_customer_by_phone(db, normalized_phone) is not None:
        raise AuthError("تلفن قبلا ثبت شده است", status_code=409)

    customer = CustomerAccount(
        email=normalized_email,
        phone=normalized_phone,
        postal_code=postal_code.strip() if postal_code else None,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        email_verified_at=None if normalized_email else None,
    )
    db.add(customer)

    try:
        db.flush()
        if normalized_email:
            from app.models.enums import VerificationAccountKind
            from app.services.email_verification_service import issue_verification

            issue_verification(
                db,
                account_kind=VerificationAccountKind.CUSTOMER,
                account_id=customer.id,
                email=normalized_email,
                full_name=customer.full_name,
            )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AuthError("این حساب قبلا ایجاد شده است", status_code=409) from exc

    db.refresh(customer)
    return customer


def customer_needs_email_verification(customer: CustomerAccount) -> bool:
    return bool(customer.email) and customer.email_verified_at is None


def authenticate_customer(db: Session, *, login: str, password: str) -> CustomerAccount:
    login = login.strip()
    if "@" in login:
        customer = get_customer_by_email(db, login)
    else:
        customer = get_customer_by_phone(db, login)

    if customer is None or not verify_password(password, customer.password_hash):
        raise AuthError("ورود یا رمز عبور نامعتبر است", status_code=401)

    if customer.email and customer.email_verified_at is None:
        raise AuthError("Email not verified", status_code=403)

    return customer
