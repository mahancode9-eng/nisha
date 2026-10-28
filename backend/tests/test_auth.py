from sqlalchemy import select

from app.models.notification import NotificationOutbox
from conftest import mark_user_email_verified


def test_register_seller(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "seller@example.com",
            "password": "securepass",
            "full_name": "Jane Seller",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["needs_email_verification"] is True
    assert data["email"] == "seller@example.com"
    assert data.get("access_token") is None


def test_login_seller(client, db):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "securepass",
            "full_name": "Login User",
        },
    )
    mark_user_email_verified(db, "login@example.com")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "securepass"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == "login@example.com"


def test_get_current_user(client, db):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "securepass",
            "full_name": "Me User",
        },
    )
    mark_user_email_verified(db, "me@example.com")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "securepass"},
    )
    token = login.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_login_rejects_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "securepass"},
    )
    assert response.status_code == 401


def test_refresh_token(client, db):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh@example.com",
            "password": "securepass",
            "full_name": "Refresh User",
        },
    )
    mark_user_email_verified(db, "refresh@example.com")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "securepass"},
    )
    refresh_token = login.json()["refresh_token"]

    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_register_duplicate_unverified_email_does_not_overwrite(client, db):
    from app.core.security import verify_password
    from app.models.user import User

    payload = {
        "email": "duplicate@example.com",
        "password": "securepass",
        "full_name": "Duplicate User",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post(
        "/api/v1/auth/register",
        json={**payload, "password": "newsecurepass", "full_name": "Updated User"},
    )
    assert first.status_code == 201
    assert second.status_code == 409

    user = db.scalar(select(User).where(User.email == "duplicate@example.com"))
    assert user is not None
    assert user.full_name == "Duplicate User"
    assert verify_password("securepass", user.password_hash)
    assert not verify_password("newsecurepass", user.password_hash)

    outbox = db.scalars(
        select(NotificationOutbox).where(NotificationOutbox.template == "email_verification")
    ).all()
    # Original register + re-send on duplicate attempt
    assert len(outbox) == 2


def test_register_duplicate_verified_email_rejected(client, db):
    payload = {
        "email": "verified-dup@example.com",
        "password": "securepass",
        "full_name": "Verified User",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    mark_user_email_verified(db, "verified-dup@example.com")
    second = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    assert second.status_code == 409


def test_change_password_success(client, db):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "changepw@example.com",
            "password": "securepass",
            "full_name": "Change PW",
        },
    )
    mark_user_email_verified(db, "changepw@example.com")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "changepw@example.com", "password": "securepass"},
    )
    token = login.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["has_password"] is True

    changed = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "securepass", "new_password": "brandnewpass"},
    )
    assert changed.status_code == 200

    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "changepw@example.com", "password": "securepass"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "changepw@example.com", "password": "brandnewpass"},
    )
    assert new_login.status_code == 200


def test_change_password_rejects_wrong_current(client, seller_headers):
    response = client.post(
        "/api/v1/auth/change-password",
        headers=seller_headers,
        json={"current_password": "wrong-password", "new_password": "brandnewpass"},
    )
    assert response.status_code == 400


def test_register_default_store_name_is_persian(client, db):
    from app.models.store import Store
    from app.models.user import User

    client.post(
        "/api/v1/auth/register",
        json={
            "email": "named@example.com",
            "password": "securepass",
            "full_name": "ماهان",
        },
    )
    user = db.scalar(select(User).where(User.email == "named@example.com"))
    assert user is not None
    store = db.scalar(select(Store).where(Store.owner_id == user.id))
    assert store is not None
    assert store.name == "فروشگاه ماهان"
