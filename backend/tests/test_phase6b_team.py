"""Phase 6b: staff accounts (Pro) — invites, roles enforced on every seller endpoint, audit log."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.routing import APIRoute
from sqlalchemy import select

from app.api.v1.seller import _AREAS
from app.core.security import hash_password
from app.main import app
from app.models.enums import BillingPeriod, OrderStatus
from app.models.notification import NotificationOutbox
from app.models.order import Order
from app.models.store import Store
from app.models.subscription import SellerSubscription
from app.models.team import StoreMember, StoreRole
from app.services import subscription_billing_service, team_service
from tests.conftest import register_seller

ORDER_STAFF = "orders@example.com"
PRODUCT_STAFF = "products@example.com"


def _owner_store(db) -> Store:
    store = db.scalar(select(Store).where(Store.slug == "seller-a"))
    assert store is not None
    return store


def _set_plan(db, store: Store, code: str) -> None:
    subscription_billing_service.admin_assign_plan(
        db, store.owner_id, plan_code=code, period=BillingPeriod.MONTHLY, months=1
    )


def _token(invite: dict) -> str:
    return parse_qs(urlparse(invite["accept_url"]).query)["token"][0]


def _join(client, db, owner_headers, email: str, role: str, name: str) -> dict:
    """Invite [email] as [role] and accept; returns headers acting in the owner's store."""
    headers = register_seller(client, db, email=email, full_name=name)
    invite = client.post("/api/v1/seller/team/invites", headers=owner_headers, json={"email": email, "role": role})
    assert invite.status_code == 201, invite.text
    accepted = client.post("/api/v1/seller/team/accept", headers=headers, json={"token": _token(invite.json())})
    assert accepted.status_code == 200, accepted.text
    return {**headers, "X-Store-Id": str(accepted.json()["store_id"])}


@pytest.fixture
def pro_store(client, public_store, db) -> dict:
    store = _owner_store(db)
    _set_plan(db, store, "pro")
    return {**public_store, "store_id": store.id}


_seq = {"n": 0}


def _order(db, store_id: int, pm_id: int, status: OrderStatus) -> Order:
    _seq["n"] += 1
    order = Order(
        store_id=store_id,
        invoice_code=f"T6B-{_seq['n']:05d}",
        invoice_password_hash=hash_password("x"),
        buyer_name="Buyer",
        buyer_phone="09120000000",
        buyer_address="Tehran",
        payment_method_id=pm_id,
        status=status,
        subtotal_amount=Decimal("1000"),
        total_amount=Decimal("1000"),
    )
    db.add(order)
    db.commit()
    return order


# --- Invites ---------------------------------------------------------------


def test_staff_needs_pro(client, public_store, db):
    res = client.post(
        "/api/v1/seller/team/invites",
        headers=public_store["seller_headers"],
        json={"email": ORDER_STAFF, "role": "order_manager"},
    )
    assert res.status_code == 403
    assert "ENTITLEMENT_REQUIRED" in res.text and "team_members" in res.text


def test_invite_accept_and_switch_store(client, pro_store, db):
    owner = pro_store["seller_headers"]
    staff = register_seller(client, db, email=ORDER_STAFF, full_name="Order Staff")
    invite = client.post("/api/v1/seller/team/invites", headers=owner, json={"email": ORDER_STAFF, "role": "order_manager"})
    assert invite.status_code == 201
    body = invite.json()
    assert body["status"] == "PENDING" and body["role"] == "order_manager"
    assert "/seller/team/accept?token=" in body["accept_url"]
    outbox = db.scalar(select(NotificationOutbox).where(NotificationOutbox.template == "team_invite"))
    assert outbox is not None and outbox.recipient == ORDER_STAFF

    # The invite is for this email only, and works once.
    stranger = register_seller(client, db, email="stranger@example.com", full_name="Stranger")
    wrong = client.post("/api/v1/seller/team/accept", headers=stranger, json={"token": _token(body)})
    assert wrong.status_code == 403
    ok = client.post("/api/v1/seller/team/accept", headers=staff, json={"token": _token(body)})
    assert ok.status_code == 200
    assert ok.json()["role"] == "order_manager"
    again = client.post("/api/v1/seller/team/accept", headers=staff, json={"token": _token(body)})
    assert again.status_code == 404

    stores = client.get("/api/v1/seller/team/my-stores", headers=staff).json()
    assert [s["is_store_owner"] for s in stores] == [True, False]
    assert stores[1]["store_id"] == pro_store["store_id"]

    # Without the header the staff member works in their own (empty) store.
    _order(db, pro_store["store_id"], pro_store["payment_method_id"], OrderStatus.PAYMENT_UPLOADED)
    own = client.get("/api/v1/seller/orders", headers=staff).json()
    in_owner = client.get("/api/v1/seller/orders", headers={**staff, "X-Store-Id": str(pro_store["store_id"])}).json()
    assert own["total"] == 0 and in_owner["total"] == 1

    team = client.get("/api/v1/seller/team", headers=owner).json()
    assert team["enabled"] is True and team["seats"] == 3
    assert [m["role"] for m in team["members"]] == ["owner", "order_manager"]
    assert team["members"][1]["status"] == "ACTIVE"


def test_expired_invite(client, pro_store, db):
    register = register_seller(client, db, email=ORDER_STAFF, full_name="Late")
    invite = client.post(
        "/api/v1/seller/team/invites",
        headers=pro_store["seller_headers"],
        json={"email": ORDER_STAFF, "role": "order_manager"},
    ).json()
    member = db.get(StoreMember, invite["id"])
    member.invite_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    res = client.post("/api/v1/seller/team/accept", headers=register, json={"token": _token(invite)})
    assert res.status_code == 410


def test_seat_limit(client, pro_store):
    owner = pro_store["seller_headers"]
    for i in range(3):
        res = client.post("/api/v1/seller/team/invites", headers=owner, json={"email": f"s{i}@example.com", "role": "product_manager"})
        assert res.status_code == 201
    fourth = client.post("/api/v1/seller/team/invites", headers=owner, json={"email": "s9@example.com", "role": "product_manager"})
    assert fourth.status_code == 403 and "max_team_members" in fourth.text


def test_cannot_reach_a_store_without_membership(client, pro_store, other_seller_headers):
    res = client.get("/api/v1/seller/orders", headers={**other_seller_headers, "X-Store-Id": str(pro_store["store_id"])})
    assert res.status_code == 403


# --- Permissions on every seller endpoint ---------------------------------


def _seller_routes():
    for sub_router, area in _AREAS:
        for route in sub_router.routes:
            if not isinstance(route, APIRoute):
                continue
            path = "/api/v1/seller" + route.path
            path = re.sub(r"\{[^}]+\}", "1", path)
            for method in route.methods - {"HEAD", "OPTIONS"}:
                yield method, path, area


def _expected_allowed(role: StoreRole, area: str, path: str) -> bool:
    if area == "exports":
        area = team_service.EXPORT_AREAS[path.rsplit("/", 1)[-1]]
    return area not in team_service.OWNER_ONLY_AREAS and role in team_service.AREA_ROLES[area]


def test_every_seller_route_has_an_area():
    covered = {id(r) for sub, _ in _AREAS for r in sub.routes}
    from app.api.v1.seller import team as team_module

    allowed_without_area = {id(r) for r in team_module.self_router.routes}
    for route in app.routes:
        if isinstance(route, APIRoute) and route.path.startswith("/api/v1/seller/"):
            endpoint_routes = [r for sub, _ in _AREAS for r in sub.routes if r.endpoint is route.endpoint]
            self_routes = [r for r in team_module.self_router.routes if r.endpoint is route.endpoint]
            assert endpoint_routes or self_routes, f"{route.path} is not in an area"
    assert covered and allowed_without_area


@pytest.mark.parametrize(
    "role,email",
    [("order_manager", ORDER_STAFF), ("product_manager", PRODUCT_STAFF), ("owner", "co-owner@example.com")],
)
def test_roles_are_enforced_on_every_seller_endpoint(client, pro_store, db, role, email):
    staff = _join(client, db, pro_store["seller_headers"], email, role, f"Staff {role}")
    checked = 0
    for method, path, area in _seller_routes():
        res = client.request(method, path, headers=staff, json={})
        allowed = _expected_allowed(StoreRole(role), area, path)
        forbidden_by_role = res.status_code == 403 and "ROLE_FORBIDDEN" in res.text
        if allowed:
            assert not forbidden_by_role, f"{role} should reach {method} {path}"
        else:
            assert forbidden_by_role, f"{role} must not reach {method} {path} (got {res.status_code})"
        checked += 1
    assert checked > 60


def test_staff_lose_access_when_removed_or_plan_lapses(client, pro_store, db):
    owner = pro_store["seller_headers"]
    staff = _join(client, db, owner, ORDER_STAFF, "order_manager", "Order Staff")
    assert client.get("/api/v1/seller/orders", headers=staff).status_code == 200

    sub = db.scalar(select(SellerSubscription).where(SellerSubscription.seller_user_id == _owner_store(db).owner_id))
    sub.current_period_end = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()
    lapsed = client.get("/api/v1/seller/orders", headers=staff)
    assert lapsed.status_code == 403 and "ENTITLEMENT_REQUIRED" in lapsed.text
    # The owner keeps their own store.
    assert client.get("/api/v1/seller/orders", headers=owner).status_code == 200

    _set_plan(db, _owner_store(db), "pro")
    member_id = client.get("/api/v1/seller/team", headers=owner).json()["members"][1]["id"]
    assert client.delete(f"/api/v1/seller/team/members/{member_id}", headers=owner).status_code == 204
    assert client.get("/api/v1/seller/orders", headers=staff).status_code == 403


def test_invited_owner_cannot_touch_billing_or_add_owners(client, pro_store, db):
    co = _join(client, db, pro_store["seller_headers"], "co-owner@example.com", "owner", "Co Owner")
    assert client.get("/api/v1/seller/store", headers=co).status_code == 200
    assert client.get("/api/v1/seller/subscription", headers=co).status_code == 403
    res = client.post("/api/v1/seller/team/invites", headers=co, json={"email": "x@example.com", "role": "owner"})
    assert res.status_code == 403
    ok = client.post("/api/v1/seller/team/invites", headers=co, json={"email": "x@example.com", "role": "order_manager"})
    assert ok.status_code == 201


def test_role_change_takes_effect(client, pro_store, db):
    owner = pro_store["seller_headers"]
    staff = _join(client, db, owner, PRODUCT_STAFF, "product_manager", "Product Staff")
    assert client.get("/api/v1/seller/orders", headers=staff).status_code == 403
    member_id = client.get("/api/v1/seller/team", headers=owner).json()["members"][1]["id"]
    res = client.patch(f"/api/v1/seller/team/members/{member_id}", headers=owner, json={"role": "order_manager"})
    assert res.status_code == 200
    assert client.get("/api/v1/seller/orders", headers=staff).status_code == 200
    assert client.get("/api/v1/seller/products", headers=staff).status_code == 403


# --- Audit log -------------------------------------------------------------


def test_audit_log_records_who_confirmed_rejected_cancelled(client, pro_store, db):
    owner = pro_store["seller_headers"]
    staff = _join(client, db, owner, ORDER_STAFF, "order_manager", "Order Staff")
    sid, pm = pro_store["store_id"], pro_store["payment_method_id"]
    to_confirm = _order(db, sid, pm, OrderStatus.PAYMENT_UPLOADED)
    to_reject = _order(db, sid, pm, OrderStatus.PAYMENT_UPLOADED)
    to_cancel = _order(db, sid, pm, OrderStatus.PAYMENT_CONFIRMED)

    assert client.post(f"/api/v1/seller/orders/{to_confirm.id}/confirm-payment", headers=staff).status_code == 200
    assert client.post(f"/api/v1/seller/orders/{to_reject.id}/reject-payment", headers=owner).status_code == 200
    cancel = client.patch(
        f"/api/v1/seller/orders/{to_cancel.id}/status",
        headers=staff,
        json={"status": "CANCELLED", "note": "مشتری منصرف شد"},
    )
    assert cancel.status_code == 200, cancel.text

    log = client.get("/api/v1/seller/team/audit", headers=owner).json()["items"]
    orders = {e["action"]: e for e in log if e["action"].startswith("order.")}
    assert orders["order.confirm_payment"]["actor_name"] == "Order Staff"
    assert orders["order.confirm_payment"]["actor_role"] == "order_manager"
    assert orders["order.confirm_payment"]["order_invoice"] == to_confirm.invoice_code
    assert orders["order.reject_payment"]["actor_role"] == "owner"
    assert orders["order.cancel"]["actor_name"] == "Order Staff"
    assert orders["order.cancel"]["details"] == "مشتری منصرف شد"
    assert {"team.invite", "team.join"} <= {e["action"] for e in log}

    # Staff can't read the log.
    assert client.get("/api/v1/seller/team/audit", headers=staff).status_code == 403


def test_order_staff_can_open_payment_receipts(db, pro_store, client):
    from app.models.user import User

    staff_headers = _join(client, db, pro_store["seller_headers"], ORDER_STAFF, "order_manager", "Order Staff")
    assert staff_headers
    staff = db.scalar(select(User).where(User.email == ORDER_STAFF))
    other = register_seller(client, db, email="viewer@example.com", full_name="Viewer")
    assert other
    viewer = db.scalar(select(User).where(User.email == "viewer@example.com"))
    store = _owner_store(db)
    assert team_service.can_view_store_orders(db, staff, store) is True
    assert team_service.can_view_store_orders(db, viewer, store) is False
