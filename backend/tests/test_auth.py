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
    assert data["access_token"]
    assert data["user"]["email"] == "seller@example.com"
    assert data["user"]["role"] == "SELLER"
    assert data["user"]["store_slug"] == "jane-seller"


def test_login_seller(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "securepass",
            "full_name": "Login User",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "securepass"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == "login@example.com"


def test_get_current_user(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "securepass",
            "full_name": "Me User",
        },
    )
    token = register_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
    assert response.json()["full_name"] == "Me User"


def test_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.com",
            "password": "securepass",
            "full_name": "Wrong Pass",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "badpassword"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "ایمیل یا رمز عبور نامعتبر است"


def test_inactive_user_cannot_login(client, db):
    from sqlalchemy import select

    from app.models.user import User

    register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "inactive@example.com",
            "password": "securepass",
            "full_name": "Inactive User",
        },
    )
    assert register.status_code == 201

    user = db.scalar(select(User).where(User.email == "inactive@example.com"))
    user.is_active = False
    db.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "securepass"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "حساب کاربری غیرفعال است"


def test_duplicate_email_fails(client):
    payload = {
        "email": "dup@example.com",
        "password": "securepass",
        "full_name": "Dup User",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post("/api/v1/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["detail"] == "ایمیل قبلا ثبت شده است"
