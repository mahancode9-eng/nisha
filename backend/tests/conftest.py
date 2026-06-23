import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app

# Import model modules so metadata is populated.
import app.models.admin_audit  # noqa: F401
import app.models.conversation  # noqa: F401
import app.models.customer_account  # noqa: F401
import app.models.customer_portal  # noqa: F401
import app.models.message  # noqa: F401
import app.models.order  # noqa: F401
import app.models.payment_method  # noqa: F401
import app.models.product  # noqa: F401
import app.models.store  # noqa: F401
import app.models.user  # noqa: F401

get_settings.cache_clear()

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def register_seller(client: TestClient, *, email: str, full_name: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "securepass",
            "full_name": full_name,
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seller_headers(client: TestClient) -> dict[str, str]:
    return register_seller(
        client,
        email="seller-a@example.com",
        full_name="Seller A",
    )


@pytest.fixture
def other_seller_headers(client: TestClient) -> dict[str, str]:
    return register_seller(
        client,
        email="seller-b@example.com",
        full_name="Seller B",
    )


@pytest.fixture
def public_store(client: TestClient, seller_headers: dict[str, str]) -> dict:
    product = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "Public Hoodie",
            "description": "Warm hoodie",
            "price": "49.99",
            "stock_quantity": 10,
            "is_active": True,
        },
    )
    assert product.status_code == 201
    product_id = product.json()["id"]

    payment_method = client.post(
        "/api/v1/seller/payment-methods",
        headers=seller_headers,
        json={
            "type": "CARD_TO_CARD",
            "display_name": "Bank Transfer",
            "card_number": "6037-1234-5678-9012",
            "owner_name": "Seller A",
            "instructions": "Send proof after payment",
        },
    )
    assert payment_method.status_code == 201

    return {
        "slug": "seller-a",
        "product_id": product_id,
        "payment_method_id": payment_method.json()["id"],
        "seller_headers": seller_headers,
    }


@pytest.fixture
def admin_headers(client: TestClient, db: Session) -> dict[str, str]:
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User

    admin = db.scalar(select(User).where(User.email == "admin@example.com"))
    if admin is None:
        admin = User(
            email="admin@example.com",
            password_hash=hash_password("admin123456"),
            full_name="Platform Admin",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "admin123456"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def placed_order(client: TestClient, public_store: dict) -> dict:
    response = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Guest Buyer",
            "buyer_phone": "+989121000000",
            "buyer_address": "Tehran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": 2}],
        },
    )
    assert response.status_code == 201
    data = response.json()
    return {
        **public_store,
        "invoice_code": data["invoice_code"],
        "password": data["invoice_edit_password"],
        "order_id": data["order_id"],
    }


# Minimal valid 1x1 PNG
PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()
