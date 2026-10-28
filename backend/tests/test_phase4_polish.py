from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import BillingPeriod
from app.models.store import Store, StoreSocialLink
from app.models.user import User
from app.services import entitlement_service, subscription_billing_service
from app.services.auth_service import normalize_email


def test_new_seller_store_enables_guest_checkout(client, db: Session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "guest-on@example.com",
            "password": "securepass",
            "full_name": "Guest On",
        },
    )
    assert response.status_code == 201
    user = db.scalar(select(User).where(User.email == normalize_email("guest-on@example.com")))
    assert user is not None
    store = db.scalar(select(Store).where(Store.owner_id == user.id))
    assert store is not None
    assert store.guest_checkout_enabled is True


def test_basic_plan_includes_excel_export(client, seller_headers, db: Session):
    seller = db.scalar(select(User).where(User.email == normalize_email("seller-a@example.com")))
    assert seller is not None
    entitlement_service.ensure_plans_seeded(db)
    free = entitlement_service.get_seller_entitlements(db, seller.id)
    assert free["excel_export"] is False

    subscription_billing_service.admin_assign_plan(
        db,
        seller.id,
        plan_code="basic",
        period=BillingPeriod.MONTHLY,
        months=1,
    )
    basic = entitlement_service.get_seller_entitlements(db, seller.id)
    assert basic["excel_export"] is True

    export = client.get("/api/v1/seller/exports/orders.csv", headers=seller_headers)
    assert export.status_code == 200
    assert "text/csv" in export.headers.get("content-type", "")


def test_track_includes_active_store_social_links(client, public_store, placed_order, db: Session):
    store = db.scalar(select(Store).where(Store.slug == public_store["slug"]))
    assert store is not None
    db.add(
        StoreSocialLink(
            store_id=store.id,
            label="تلگرام",
            url="@nisha_demo",
            icon_key="telegram",
            sort_order=0,
            is_active=True,
        )
    )
    db.add(
        StoreSocialLink(
            store_id=store.id,
            label="مخفی",
            url="@hidden",
            icon_key="telegram",
            sort_order=1,
            is_active=False,
        )
    )
    db.commit()

    tracked = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_edit_password": placed_order["password"],
        },
    )
    assert tracked.status_code == 200
    links = tracked.json()["store"]["social_links"]
    assert len(links) == 1
    assert links[0]["icon_key"] == "telegram"
    assert links[0]["url"] == "@nisha_demo"
