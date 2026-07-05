from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.customer_account import CustomerAccount
from app.models.customer_portal import CustomerAddress
from app.services.auth_service import AuthError, normalize_email
from app.services.customer_auth_service import (
    get_customer_by_email,
    get_customer_by_phone,
    normalize_phone,
)


def update_customer_profile(
    db: Session,
    customer: CustomerAccount,
    *,
    email: str | None = None,
    phone: str | None = None,
    postal_code: str | None = None,
    full_name: str | None = None,
) -> CustomerAccount:
    normalized_email = normalize_email(email) if email is not None and email.strip() else None
    normalized_phone = normalize_phone(phone) if phone is not None and phone.strip() else None

    if normalized_email is not None and normalized_email != customer.email:
        existing = get_customer_by_email(db, normalized_email)
        if existing is not None and existing.id != customer.id:
            raise AuthError("ایمیل قبلا ثبت شده است", status_code=409)
        customer.email = normalized_email

    if normalized_phone is not None and normalized_phone != customer.phone:
        existing = get_customer_by_phone(db, normalized_phone)
        if existing is not None and existing.id != customer.id:
            raise AuthError("تلفن قبلا ثبت شده است", status_code=409)
        customer.phone = normalized_phone

    if postal_code is not None:
        customer.postal_code = postal_code.strip() or None

    if full_name is not None:
        customer.full_name = full_name.strip()

    db.commit()
    db.refresh(customer)
    return customer


def list_addresses(db: Session, customer_id: int) -> list[CustomerAddress]:
    return list(
        db.scalars(
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
        ).all()
    )


def _unset_default_addresses(db: Session, customer_id: int) -> None:
    db.execute(
        update(CustomerAddress)
        .where(CustomerAddress.customer_id == customer_id)
        .values(is_default=False)
    )


def create_address(
    db: Session,
    customer_id: int,
    *,
    label: str | None,
    recipient_name: str,
    recipient_phone: str,
    postal_code: str | None,
    address_line1: str,
    address_line2: str | None,
    city: str | None,
    province: str | None,
    country: str | None,
    is_default: bool,
) -> CustomerAddress:
    if is_default:
        _unset_default_addresses(db, customer_id)

    address = CustomerAddress(
        customer_id=customer_id,
        label=label.strip() if label else None,
        recipient_name=recipient_name.strip(),
        recipient_phone=normalize_phone(recipient_phone),
        postal_code=postal_code.strip() if postal_code else None,
        address_line1=address_line1.strip(),
        address_line2=address_line2.strip() if address_line2 else None,
        city=city.strip() if city else None,
        province=province.strip() if province else None,
        country=country.strip() if country else None,
        is_default=is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


def get_address(db: Session, customer_id: int, address_id: int) -> CustomerAddress:
    address = db.scalar(
        select(CustomerAddress).where(
            CustomerAddress.id == address_id,
            CustomerAddress.customer_id == customer_id,
        )
    )
    if address is None:
        raise AuthError("آدرس پیدا نشد", status_code=404)
    return address


def update_address(
    db: Session,
    customer_id: int,
    address_id: int,
    *,
    label: str | None = None,
    recipient_name: str | None = None,
    recipient_phone: str | None = None,
    postal_code: str | None = None,
    address_line1: str | None = None,
    address_line2: str | None = None,
    city: str | None = None,
    province: str | None = None,
    country: str | None = None,
    is_default: bool | None = None,
) -> CustomerAddress:
    address = get_address(db, customer_id, address_id)

    if label is not None:
        address.label = label.strip() or None
    if recipient_name is not None:
        address.recipient_name = recipient_name.strip()
    if recipient_phone is not None:
        address.recipient_phone = normalize_phone(recipient_phone)
    if postal_code is not None:
        address.postal_code = postal_code.strip() or None
    if address_line1 is not None:
        address.address_line1 = address_line1.strip()
    if address_line2 is not None:
        address.address_line2 = address_line2.strip() or None
    if city is not None:
        address.city = city.strip() or None
    if province is not None:
        address.province = province.strip() or None
    if country is not None:
        address.country = country.strip() or None

    if is_default is not None:
        if is_default:
            _unset_default_addresses(db, customer_id)
        address.is_default = is_default

    db.commit()
    db.refresh(address)
    return address


def delete_address(db: Session, customer_id: int, address_id: int) -> None:
    address = get_address(db, customer_id, address_id)
    db.delete(address)
    db.commit()


def get_default_address(db: Session, customer_id: int) -> CustomerAddress | None:
    return db.scalar(
        select(CustomerAddress)
        .where(CustomerAddress.customer_id == customer_id, CustomerAddress.is_default.is_(True))
        .order_by(CustomerAddress.created_at.desc())
    )
