"""Phase 6b: custom domains (Pro) — ownership TXT check, routing, on-demand HTTPS, CORS."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.models.domain import StoreDomain
from app.models.enums import BillingPeriod
from app.models.store import Store
from app.models.subscription import SellerSubscription
from app.services import domain_service, subscription_billing_service
from app.services.exceptions import ServiceError

HOST = "shop.example.com"


class FakeDns:
    def __init__(self) -> None:
        self.txt: dict[str, list[str]] = {}
        self.cname: dict[str, list[str]] = {}
        self.a: dict[str, list[str]] = {}

    def lookup_txt(self, name: str) -> list[str]:
        return self.txt.get(name, [])

    def lookup_pointing(self, hostname: str) -> tuple[list[str], list[str]]:
        return self.cname.get(hostname, []), self.a.get(hostname, [])


@pytest.fixture
def dns(monkeypatch) -> FakeDns:
    fake = FakeDns()
    monkeypatch.setattr(domain_service, "lookup_txt", fake.lookup_txt)
    monkeypatch.setattr(domain_service, "lookup_pointing", fake.lookup_pointing)
    monkeypatch.setattr(domain_service.settings, "CUSTOM_DOMAIN_CNAME_TARGET", "stores.nisha.ir")
    monkeypatch.setattr(domain_service.settings, "CUSTOM_DOMAIN_IPV4", "203.0.113.10")
    monkeypatch.setattr(domain_service.settings, "CUSTOM_DOMAIN_RESERVED", "nisha.ir")
    domain_service._invalidate()
    return fake


def _store(db) -> Store:
    store = db.scalar(select(Store).where(Store.slug == "seller-a"))
    assert store is not None
    return store


def _set_plan(db, store: Store, code: str) -> None:
    subscription_billing_service.admin_assign_plan(
        db, store.owner_id, plan_code=code, period=BillingPeriod.MONTHLY, months=1
    )


@pytest.fixture
def pro(client, public_store, db, dns) -> dict:
    _set_plan(db, _store(db), "pro")
    return public_store


def _connect_and_verify(client, headers, dns: FakeDns, host: str = HOST) -> dict:
    body = client.put("/api/v1/seller/domain", headers=headers, json={"hostname": host}).json()
    txt = next(r for r in body["records"] if r["type"] == "TXT")
    dns.txt[txt["name"]] = [txt["value"]]
    dns.cname[host] = ["stores.nisha.ir"]
    res = client.post("/api/v1/seller/domain/verify", headers=headers)
    assert res.status_code == 200, res.text
    return res.json()


# --- Hostnames -------------------------------------------------------------


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("Shop.Example.com", "shop.example.com"),
        ("https://shop.example.com/path?x=1", "shop.example.com"),
        ("shop.example.com:443", "shop.example.com"),
        ("shop.example.com.", "shop.example.com"),
        ("فروشگاه.ir", "فروشگاه".encode("idna").decode() + ".ir"),
    ],
)
def test_hostnames_are_normalised(dns, raw, expected):
    assert domain_service.normalize_hostname(raw) == expected


@pytest.mark.parametrize("raw", ["localhost", "1.2.3.4", "no_underscores.com", "-bad.com", "nisha.ir", "x.nisha.ir", "a..b.com"])
def test_bad_or_reserved_hostnames_are_refused(dns, raw):
    with pytest.raises(ServiceError):
        domain_service.normalize_hostname(raw)


# --- Setup flow ------------------------------------------------------------


def test_custom_domain_is_pro(client, public_store, dns):
    headers = public_store["seller_headers"]
    res = client.put("/api/v1/seller/domain", headers=headers, json={"hostname": HOST})
    assert res.status_code == 403 and "custom_domain" in res.text
    assert client.get("/api/v1/seller/domain", headers=headers).json()["plan_enabled"] is False


def test_setup_guide_records_and_verification(client, pro, dns):
    headers = pro["seller_headers"]
    body = client.put("/api/v1/seller/domain", headers=headers, json={"hostname": "https://Shop.Example.com/"}).json()
    assert body["hostname"] == HOST and body["status"] == "pending"
    records = {r["type"]: r for r in body["records"]}
    assert records["TXT"]["name"] == f"_nisha-verify.{HOST}"
    assert records["TXT"]["value"].startswith("nisha-verify=")
    assert records["CNAME"] == {"type": "CNAME", "name": HOST, "value": "stores.nisha.ir"}

    # Nothing in DNS yet.
    res = client.post("/api/v1/seller/domain/verify", headers=headers).json()
    assert res["status"] == "pending" and "TXT" in res["last_error"]

    # A wrong value.
    dns.txt[records["TXT"]["name"]] = ["nisha-verify=wrong"]
    res = client.post("/api/v1/seller/domain/verify", headers=headers).json()
    assert res["status"] == "pending" and res["verified_at"] is None

    # Owned, not pointing at Nisha yet.
    dns.txt[records["TXT"]["name"]] = [records["TXT"]["value"]]
    res = client.post("/api/v1/seller/domain/verify", headers=headers).json()
    assert res["status"] == "verified" and res["verified_at"] and res["dns_pointing"] is False

    # Live.
    dns.cname[HOST] = ["stores.nisha.ir"]
    res = client.post("/api/v1/seller/domain/verify", headers=headers).json()
    assert res["status"] == "active" and res["url"] == f"https://{HOST}" and res["last_error"] is None


def test_apex_domains_get_a_records(client, pro, dns):
    body = client.put("/api/v1/seller/domain", headers=pro["seller_headers"], json={"hostname": "example.com"}).json()
    assert {"type": "A", "name": "example.com", "value": "203.0.113.10"} in body["records"]
    dns.a["example.com"] = ["203.0.113.10"]
    txt = next(r for r in body["records"] if r["type"] == "TXT")
    dns.txt[txt["name"]] = [txt["value"]]
    assert client.post("/api/v1/seller/domain/verify", headers=pro["seller_headers"]).json()["status"] == "active"


def test_changing_the_domain_needs_a_new_check(client, pro, dns):
    headers = pro["seller_headers"]
    first = _connect_and_verify(client, headers, dns)
    assert first["status"] == "active"
    other = client.put("/api/v1/seller/domain", headers=headers, json={"hostname": "new.example.com"}).json()
    assert other["status"] == "pending"
    assert other["records"][0]["value"] != first["records"][0]["value"]


def test_a_domain_belongs_to_one_store(client, pro, other_seller_headers, db, dns):
    _connect_and_verify(client, pro["seller_headers"], dns)
    other = db.scalar(select(Store).where(Store.slug == "seller-b"))
    _set_plan(db, other, "pro")
    res = client.put("/api/v1/seller/domain", headers=other_seller_headers, json={"hostname": HOST})
    assert res.status_code == 409


# --- Routing and HTTPS -----------------------------------------------------


def test_routing_and_tls_only_for_verified_pro_domains(client, pro, db, dns):
    headers = pro["seller_headers"]
    client.put("/api/v1/seller/domain", headers=headers, json={"hostname": HOST})
    # Unverified: no routing, no certificate.
    assert client.get(f"/api/v1/public/domains/resolve?host={HOST}").status_code == 404
    assert client.get(f"/api/v1/public/domains/tls-check?domain={HOST}").status_code == 404

    _connect_and_verify(client, headers, dns)
    res = client.get(f"/api/v1/public/domains/resolve?host={HOST.upper()}")
    assert res.status_code == 200 and res.json()["slug"] == "seller-a"
    assert client.get(f"/api/v1/public/domains/tls-check?domain={HOST}").status_code == 200
    assert client.get("/api/v1/public/domains/resolve?host=unknown.example.com").status_code == 404
    assert client.get("/api/v1/public/domains/tls-check?domain=unknown.example.com").status_code == 404

    # A lapsed Pro plan stops routing (and new certificates) without losing the setup.
    sub = db.scalar(select(SellerSubscription).where(SellerSubscription.seller_user_id == _store(db).owner_id))
    sub.current_period_end = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()
    assert client.get(f"/api/v1/public/domains/resolve?host={HOST}").status_code == 404
    assert client.get(f"/api/v1/public/domains/tls-check?domain={HOST}").status_code == 404
    assert db.scalar(select(StoreDomain).where(StoreDomain.hostname == HOST)) is not None


def test_disconnect(client, pro, dns):
    headers = pro["seller_headers"]
    _connect_and_verify(client, headers, dns)
    assert client.delete("/api/v1/seller/domain", headers=headers).status_code == 204
    assert client.get("/api/v1/seller/domain", headers=headers).json()["status"] == "none"
    assert client.get(f"/api/v1/public/domains/resolve?host={HOST}").status_code == 404


def test_cors_allows_verified_custom_domains(client, pro, dns, db, monkeypatch):
    import app.main as main

    # The CORS check opens its own session; point it at the test database.
    monkeypatch.setattr(main, "SessionLocal", sessionmaker(bind=db.get_bind()))
    _connect_and_verify(client, pro["seller_headers"], dns)
    domain_service._invalidate()
    ok = client.options(
        "/api/v1/public/stores/seller-a",
        headers={"Origin": f"https://{HOST}", "Access-Control-Request-Method": "GET"},
    )
    assert ok.headers.get("access-control-allow-origin") == f"https://{HOST}"
    evil = client.options(
        "/api/v1/public/stores/seller-a",
        headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "GET"},
    )
    assert evil.headers.get("access-control-allow-origin") is None
    plain_http = client.options(
        "/api/v1/public/stores/seller-a",
        headers={"Origin": f"http://{HOST}", "Access-Control-Request-Method": "GET"},
    )
    assert plain_http.headers.get("access-control-allow-origin") is None
