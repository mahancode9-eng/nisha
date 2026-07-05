from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password, verify_password
from app.models.enums import UserRole
from app.models.store import Store
from app.models.user import User
from app.utils.slug import generate_unique_store_slug
from app.core.messages import translate_backend_message


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = translate_backend_message(message)
        self.status_code = status_code
        super().__init__(self.message)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def register_seller(db: Session, *, email: str, password: str, full_name: str) -> User:
    normalized_email = normalize_email(email)

    if get_user_by_email(db, normalized_email) is not None:
        raise AuthError("ایمیل قبلا ثبت شده است", status_code=409)

    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        role=UserRole.SELLER,
        is_active=True,
    )
    db.add(user)

    try:
        db.flush()
        slug_base = full_name.strip() or normalized_email.split("@")[0]
        store = Store(
            owner_id=user.id,
            name=f"{user.full_name}'s Store",
            slug=generate_unique_store_slug(db, slug_base),
            is_active=True,
        )
        db.add(store)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AuthError("ایمیل قبلا ثبت شده است", status_code=409) from exc

    return db.scalar(
        select(User)
        .options(selectinload(User.store))
        .where(User.id == user.id)
    )


def authenticate_user(db: Session, *, email: str, password: str) -> User:
    normalized_email = normalize_email(email)
    user = db.scalar(
        select(User)
        .options(selectinload(User.store))
        .where(User.email == normalized_email)
    )

    if user is None or not verify_password(password, user.password_hash):
        raise AuthError("ایمیل یا رمز عبور نامعتبر است", status_code=401)

    if not user.is_active:
        raise AuthError("حساب کاربری غیرفعال است", status_code=403)

    return user
