"""
Seed demo data for local development.

Run from the backend directory:
    python -m scripts.seed
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import PaymentMethodType, UserRole
from app.models.payment_method import PaymentMethod
from app.models.product import Product
from app.models.store import Store
from app.models.user import User

# Register related mappers used by User/Store relationships.
import app.models.order  # noqa: F401
import app.models.subscription  # noqa: F401

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123456"
SELLER_EMAIL = "seller@example.com"
SELLER_PASSWORD = "seller123456"
STORE_SLUG = "demo-store"


def get_or_create_admin(db) -> User:
    user = db.scalar(select(User).where(User.email == ADMIN_EMAIL))
    now = datetime.now(timezone.utc)
    if user is None:
        user = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            full_name="Platform Admin",
            role=UserRole.ADMIN,
            is_active=True,
            email_verified_at=now,
        )
        db.add(user)
        db.flush()
        print(f"Created admin: {ADMIN_EMAIL}")
    else:
        # Never reset an existing admin password — seed must not enable takeover.
        user.role = UserRole.ADMIN
        user.is_active = True
        if user.email_verified_at is None:
            user.email_verified_at = now
        print(f"Admin already exists (password unchanged): {ADMIN_EMAIL}")
    return user


def get_or_create_seller_and_store(db) -> tuple[User, Store]:
    user = db.scalar(select(User).where(User.email == SELLER_EMAIL))
    if user is None:
        user = User(
            email=SELLER_EMAIL,
            password_hash=hash_password(SELLER_PASSWORD),
            full_name="Demo Seller",
            role=UserRole.SELLER,
            is_active=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.flush()
        print(f"Created seller: {SELLER_EMAIL}")
    elif user.email_verified_at is None:
        user.email_verified_at = datetime.now(timezone.utc)
        user.is_active = True
        print(f"Seller already exists, verified (password unchanged): {SELLER_EMAIL}")

    store = db.scalar(select(Store).where(Store.slug == STORE_SLUG))
    if store is None:
        store = Store(
            owner_id=user.id,
            name="Demo Store",
            slug=STORE_SLUG,
            description="A demo store for testing the Nisha platform.",
            phone="+989121234567",
            support_contact="support@demo-store.example.com",
            is_active=True,
        )
        db.add(store)
        db.flush()
        print(f"Created store: {STORE_SLUG}")
    else:
        print(f"Store already exists: {STORE_SLUG}")

    return user, store


def seed_products(db, store: Store) -> None:
    products_data = [
        {
            "title": "Classic T-Shirt",
            "description": "Comfortable cotton t-shirt.",
            "price": Decimal("29.99"),
            "stock_quantity": 50,
        },
        {
            "title": "Hoodie",
            "description": "Warm hoodie for cold days.",
            "price": Decimal("49.99"),
            "stock_quantity": 30,
        },
        {
            "title": "Cap",
            "description": "Adjustable cap.",
            "price": Decimal("19.99"),
            "stock_quantity": 100,
        },
    ]

    for data in products_data:
        exists = db.scalar(
            select(Product.id).where(
                Product.store_id == store.id,
                Product.title == data["title"],
            )
        )
        if exists is not None:
            continue
        db.add(Product(store_id=store.id, is_active=True, **data))
        print(f"Created product: {data['title']}")


def seed_payment_methods(db, store: Store) -> None:
    methods_data = [
        {
            "type": PaymentMethodType.CARD_TO_CARD,
            "display_name": "Bank Transfer",
            "card_number": "6037-1234-5678-9012",
            "owner_name": "Demo Seller",
            "instructions": "Transfer and upload your receipt on the order page.",
        },
        {
            "type": PaymentMethodType.CRYPTO,
            "display_name": "USDT (TRC20)",
            "wallet_address": "TXdemo1234567890abcdef",
            "instructions": "Send exact amount and upload proof.",
        },
    ]

    for data in methods_data:
        exists = db.scalar(
            select(PaymentMethod.id).where(
                PaymentMethod.store_id == store.id,
                PaymentMethod.display_name == data["display_name"],
            )
        )
        if exists is not None:
            continue
        db.add(PaymentMethod(store_id=store.id, is_active=True, **data))
        print(f"Created payment method: {data['display_name']}")


def main() -> None:
    from app.core.config import settings

    if settings.ENVIRONMENT == "production" and not settings.ALLOW_DEMO_SEED:
        raise SystemExit(
            "Refusing to seed in production. Set ALLOW_DEMO_SEED=true to override."
        )

    db = SessionLocal()
    try:
        get_or_create_admin(db)
        _, store = get_or_create_seller_and_store(db)
        seed_products(db, store)
        seed_payment_methods(db, store)
        db.commit()
        print("\nSeed completed successfully.")
        print(f"  Admin:  {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"  Seller: {SELLER_EMAIL} / {SELLER_PASSWORD}")
        print(f"  Store:  http://localhost:3000/store/{STORE_SLUG} (public slug: {STORE_SLUG})")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
