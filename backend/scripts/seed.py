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
from app.models.customer_account import CustomerAccount
from app.models.enums import PaymentMethodType, UserRole
from app.models.payment_method import PaymentMethod
from app.models.product import Product
from app.models.store import Store
from app.models.user import User

# Register related mappers so SQLAlchemy can resolve relationships.
import app.models.admin_audit  # noqa: F401
import app.models.analytics  # noqa: F401
import app.models.conversation  # noqa: F401
import app.models.customer_account  # noqa: F401
import app.models.customer_portal  # noqa: F401
import app.models.message  # noqa: F401
import app.models.email_verification  # noqa: F401
import app.models.notification  # noqa: F401
import app.models.user_password_recovery  # noqa: F401
import app.models.order  # noqa: F401
import app.models.payment_method  # noqa: F401
import app.models.platform_setting  # noqa: F401
import app.models.product  # noqa: F401
import app.models.product_category  # noqa: F401
import app.models.store  # noqa: F401
import app.models.subscription  # noqa: F401
import app.models.user  # noqa: F401

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123456"
SELLER_EMAIL = "seller@example.com"
SELLER_PASSWORD = "seller123456"
SELLER2_EMAIL = "seller2@example.com"
SELLER2_PASSWORD = "seller123456"
STORE_SLUG = "demo-store"
STORE2_SLUG = "nisha-shop"
CUSTOMER_EMAIL = "customer@example.com"
CUSTOMER_PASSWORD = "customer123456"
CUSTOMER_PHONE = "+989001112233"

TEST_USERS = [
    {"role": "admin", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    {"role": "seller", "email": SELLER_EMAIL, "password": SELLER_PASSWORD, "store": STORE_SLUG},
    {"role": "seller", "email": SELLER2_EMAIL, "password": SELLER2_PASSWORD, "store": STORE2_SLUG},
    {"role": "customer", "email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD, "phone": CUSTOMER_PHONE},
]


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


def get_or_create_seller_and_store(
    db,
    *,
    email: str,
    password: str,
    full_name: str,
    store_name: str,
    store_slug: str,
    description: str,
    phone: str,
) -> tuple[User, Store]:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole.SELLER,
            is_active=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.flush()
        print(f"Created seller: {email}")
    else:
        user.is_active = True
        if user.email_verified_at is None:
            user.email_verified_at = datetime.now(timezone.utc)
        print(f"Seller already exists, verified (password unchanged): {email}")

    store = db.scalar(select(Store).where(Store.slug == store_slug))
    if store is None:
        store = Store(
            owner_id=user.id,
            name=store_name,
            slug=store_slug,
            description=description,
            phone=phone,
            support_contact=f"support@{store_slug}.example.com",
            is_active=True,
        )
        db.add(store)
        db.flush()
        print(f"Created store: {store_slug}")
    else:
        print(f"Store already exists: {store_slug}")

    return user, store


def get_or_create_customer(db) -> CustomerAccount:
    customer = db.scalar(select(CustomerAccount).where(CustomerAccount.email == CUSTOMER_EMAIL))
    now = datetime.now(timezone.utc)
    if customer is None:
        customer = CustomerAccount(
            email=CUSTOMER_EMAIL,
            phone=CUSTOMER_PHONE,
            password_hash=hash_password(CUSTOMER_PASSWORD),
            full_name="Demo Customer",
            email_verified_at=now,
        )
        db.add(customer)
        db.flush()
        print(f"Created customer: {CUSTOMER_EMAIL}")
    else:
        customer.phone = customer.phone or CUSTOMER_PHONE
        if customer.email_verified_at is None:
            customer.email_verified_at = now
        print(f"Customer already exists, verified (password unchanged): {CUSTOMER_EMAIL}")
    return customer


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
        _, store = get_or_create_seller_and_store(
            db,
            email=SELLER_EMAIL,
            password=SELLER_PASSWORD,
            full_name="Demo Seller",
            store_name="Demo Store",
            store_slug=STORE_SLUG,
            description="A demo store for testing the Nisha platform.",
            phone="+989121234567",
        )
        _, store2 = get_or_create_seller_and_store(
            db,
            email=SELLER2_EMAIL,
            password=SELLER2_PASSWORD,
            full_name="Nisha Seller",
            store_name="Nisha Shop",
            store_slug=STORE2_SLUG,
            description="Second demo store for multi-seller testing.",
            phone="+989129876543",
        )
        get_or_create_customer(db)
        seed_products(db, store)
        seed_payment_methods(db, store)
        seed_payment_methods(db, store2)
        db.commit()
        print("\nSeed completed successfully.")
        print("Test logins (all emails are pre-verified):")
        for account in TEST_USERS:
            store_note = f"  store=/{account['store']}" if account.get("store") else ""
            print(f"  {account['role']:<8} {account['email']} / {account['password']}{store_note}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
