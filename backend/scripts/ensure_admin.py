from datetime import datetime, timezone

from sqlalchemy import text

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.session import SessionLocal

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123456"


def main() -> None:
    if settings.ENVIRONMENT == "production" and not settings.ALLOW_DEMO_SEED:
        raise SystemExit(
            "Refusing to ensure_admin in production. Set ALLOW_DEMO_SEED=true to override."
        )

    password_hash = hash_password(ADMIN_PASSWORD)
    assert verify_password(ADMIN_PASSWORD, password_hash)
    now = datetime.now(timezone.utc)

    db = SessionLocal()
    try:
        row = db.execute(
            text("SELECT id, password_hash FROM users WHERE email = :email"),
            {"email": ADMIN_EMAIL},
        ).first()
        if row is None:
            db.execute(
                text(
                    """
                    INSERT INTO users (
                        email, password_hash, full_name, role, is_active,
                        email_verified_at, created_at, updated_at
                    ) VALUES (
                        :email, :password_hash, :full_name, 'ADMIN', true,
                        :now, :now, :now
                    )
                    """
                ),
                {
                    "email": ADMIN_EMAIL,
                    "password_hash": password_hash,
                    "full_name": "Platform Admin",
                    "now": now,
                },
            )
            print("created")
        else:
            # Never reset an existing admin password.
            db.execute(
                text(
                    """
                    UPDATE users
                    SET role = 'ADMIN',
                        is_active = true,
                        email_verified_at = COALESCE(email_verified_at, :now),
                        updated_at = :now
                    WHERE email = :email
                    """
                ),
                {
                    "email": ADMIN_EMAIL,
                    "now": now,
                },
            )
            print("updated_without_password_reset")
        db.commit()

        stored = db.execute(
            text("SELECT password_hash, role, email_verified_at FROM users WHERE email = :email"),
            {"email": ADMIN_EMAIL},
        ).one()
        print(
            "ok",
            ADMIN_EMAIL,
            verify_password(ADMIN_PASSWORD, stored.password_hash)
            if row is None
            else "password_unchanged",
            stored.role,
            stored.email_verified_at is not None,
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
