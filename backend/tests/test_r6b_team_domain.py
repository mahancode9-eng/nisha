"""R6b: white-label flag, store team, custom domain."""

from app.models.enums import BillingPeriod
from app.services import subscription_billing_service
from app.services.auth_service import normalize_email
from sqlalchemy import select


def _upgrade_to_enterprise(db, email: str = "seller-a@example.com"):
    from app.models.user import User

    seller = db.scalar(select(User).where(User.email == normalize_email(email)))
    assert seller is not None
    subscription_billing_service.admin_assign_plan(
        db,
        seller.id,
        plan_code="enterprise",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    return seller


def test_remove_branding_flag_on_pro_store(client, public_store, db):
    from app.models.user import User

    seller = db.scalar(
        select(User).where(User.email == normalize_email("seller-a@example.com"))
    )
    assert seller is not None
    subscription_billing_service.admin_assign_plan(
        db,
        seller.id,
        plan_code="pro",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    page = client.get(f"/api/v1/public/stores/{public_store['slug']}")
    assert page.status_code == 200
    assert page.json()["store"]["remove_nisha_watermark"] is True


def test_team_invite_and_audit(client, public_store, db):
    _upgrade_to_enterprise(db)
    invite = client.post(
        "/api/v1/seller/team/members",
        headers=public_store["seller_headers"],
        json={"email": "staff@example.com", "role": "STAFF"},
    )
    assert invite.status_code == 201
    assert invite.json()["email"] == "staff@example.com"

    logs = client.get(
        "/api/v1/seller/team/audit-logs",
        headers=public_store["seller_headers"],
    )
    assert logs.status_code == 200
    assert any(row["action"] == "member.invite" for row in logs.json())


def test_custom_domain_set_and_resolve(client, public_store, db):
    _upgrade_to_enterprise(db)
    set_domain = client.put(
        "/api/v1/seller/team/domain",
        headers=public_store["seller_headers"],
        json={"custom_domain": "shop.example.test"},
    )
    assert set_domain.status_code == 200
    assert set_domain.json()["custom_domain"] == "shop.example.test"
    assert set_domain.json()["custom_domain_verified_at"] is None

    verify = client.post(
        "/api/v1/seller/team/domain/verify",
        headers=public_store["seller_headers"],
    )
    assert verify.status_code == 200
    assert verify.json()["custom_domain_verified_at"] is not None

    resolved = client.get("/api/v1/public/stores/resolve-host?host=shop.example.test")
    assert resolved.status_code == 200
    assert resolved.json()["store"]["slug"] == public_store["slug"]

    slim = client.get("/api/v1/public/domains/resolve?host=shop.example.test")
    assert slim.status_code == 200
    assert slim.json()["slug"] == public_store["slug"]
    assert isinstance(slim.json()["store_id"], int)

    missing = client.get("/api/v1/public/domains/resolve?host=unknown.example.test")
    assert missing.status_code == 404


def test_custom_domain_dns_instructions_on_store(client, public_store, db):
    _upgrade_to_enterprise(db)
    set_domain = client.put(
        "/api/v1/seller/team/domain",
        headers=public_store["seller_headers"],
        json={"custom_domain": "brand.example.test"},
    )
    assert set_domain.status_code == 200
    body = set_domain.json()
    assert body["custom_domain_txt_name"] == "_nisha-verify.brand.example.test"
    assert body["custom_domain_txt_value"].startswith("nisha-verify=")


def test_production_verify_requires_txt(client, public_store, db, monkeypatch):
    from app.core.config import settings
    from app.services import custom_domain_service

    _upgrade_to_enterprise(db)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CUSTOM_DOMAIN_CNAME_TARGET", "")
    monkeypatch.setattr(settings, "CUSTOM_DOMAIN_IPV4", "")

    set_domain = client.put(
        "/api/v1/seller/team/domain",
        headers=public_store["seller_headers"],
        json={"custom_domain": "live.example.com"},
    )
    assert set_domain.status_code == 200
    expected_txt = set_domain.json()["custom_domain_txt_value"]

    monkeypatch.setattr(custom_domain_service, "lookup_txt", lambda _name: [])
    pending = client.post(
        "/api/v1/seller/team/domain/verify",
        headers=public_store["seller_headers"],
    )
    assert pending.status_code == 422

    monkeypatch.setattr(custom_domain_service, "lookup_txt", lambda _name: [expected_txt])
    ok = client.post(
        "/api/v1/seller/team/domain/verify",
        headers=public_store["seller_headers"],
    )
    assert ok.status_code == 200
    assert ok.json()["custom_domain_verified_at"] is not None
