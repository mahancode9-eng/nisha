"""Phase 6a: monthly sales report, Excel on Basic, customer list/tags/export, branding toggle."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.models.enums import BillingPeriod, OrderStatus
from app.models.order import Order, OrderItem
from app.models.store import Store
from app.models.subscription import SellerSubscription
from app.models.user import User
from app.services import entitlement_service, subscription_billing_service
from app.utils import jalali

# Aban 1404 = 23 Oct – 21 Nov 2025 (Tehran midnight = 20:30 UTC the day before).
ABAN_1404 = datetime(2025, 11, 1, 12, 0, tzinfo=timezone.utc)
MEHR_1404 = datetime(2025, 10, 10, 12, 0, tzinfo=timezone.utc)

_counter = {"n": 0}


def _store(db, slug: str = "seller-a") -> Store:
    store = db.scalar(select(Store).where(Store.slug == slug))
    assert store is not None
    return store


def _set_plan(db, store: Store, code: str) -> None:
    subscription_billing_service.admin_assign_plan(
        db, store.owner_id, plan_code=code, period=BillingPeriod.MONTHLY, months=1
    )


def _order(
    db,
    store: Store,
    payment_method_id: int,
    *,
    total: str,
    status: OrderStatus = OrderStatus.PAYMENT_CONFIRMED,
    created_at: datetime = ABAN_1404,
    phone: str = "09120000001",
    name: str = "Buyer",
    manual: bool = False,
    items: list[tuple[int | None, str, int, str]] = (),
) -> Order:
    _counter["n"] += 1
    order = Order(
        store_id=store.id,
        invoice_code=f"P6-{_counter['n']:05d}",
        invoice_password_hash=hash_password("x"),
        buyer_name=name,
        buyer_phone=phone,
        buyer_address="Tehran",
        payment_method_id=payment_method_id,
        status=status,
        subtotal_amount=Decimal(total),
        total_amount=Decimal(total),
        is_manual=manual,
    )
    db.add(order)
    db.flush()
    order.created_at = created_at
    for product_id, title, qty, line_total in items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product_id,
                product_title_snapshot=title,
                unit_price_snapshot=Decimal(line_total) / qty,
                quantity=qty,
                total_price=Decimal(line_total),
            )
        )
    db.commit()
    return order


def _forbidden_by_plan(res, entitlement: str) -> None:
    assert res.status_code == 403, res.text
    body = res.json()
    assert body.get("code") == "ENTITLEMENT_REQUIRED" or "ENTITLEMENT_REQUIRED" in res.text
    assert entitlement in res.text


# --- Jalali months ---------------------------------------------------------


def test_jalali_month_boundaries_follow_tehran_midnight():
    start, end = jalali.month_range(1404, 8)
    assert start == datetime(2025, 10, 22, 20, 30, tzinfo=timezone.utc)
    assert end == datetime(2025, 11, 21, 20, 30, tzinfo=timezone.utc)
    assert jalali.gregorian_to_jalali(2025, 3, 21) == (1404, 1, 1)
    assert jalali.jalali_to_gregorian(1403, 12, 30) == (2025, 3, 20)
    assert jalali.shift_month(1404, 1, -1) == (1403, 12)
    assert jalali.month_label(1404, 8) == "آبان 1404"


# --- 1. Sales report -------------------------------------------------------


def test_sales_report_counts_paid_orders_including_manual(client, public_store, db):
    store = _store(db)
    pm = public_store["payment_method_id"]
    pid = public_store["product_id"]
    _order(db, store, pm, total="100000", items=[(pid, "Hoodie", 2, "100000")])
    _order(db, store, pm, total="50000", status=OrderStatus.DELIVERED, items=[(pid, "Hoodie", 1, "50000")])
    _order(db, store, pm, total="30000", manual=True, items=[(None, "Handmade cup", 3, "30000")])
    # Not sales: unpaid, cancelled, and last month.
    _order(db, store, pm, total="999000", status=OrderStatus.PENDING_PAYMENT)
    _order(db, store, pm, total="999000", status=OrderStatus.CANCELLED)
    _order(db, store, pm, total="70000", created_at=MEHR_1404)

    res = client.get("/api/v1/seller/reports/sales?month=1404-08", headers=public_store["seller_headers"])
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["month"] == "1404-08"
    assert body["month_label"] == "آبان 1404"
    assert body["previous_month"] == "1404-07"
    assert body["next_month"] == "1404-09"
    assert Decimal(body["total_sales"]) == Decimal("180000")
    assert body["order_count"] == 3
    assert Decimal(body["average_order_value"]) == Decimal("60000")
    assert body["manual_order_count"] == 1
    assert Decimal(body["manual_sales"]) == Decimal("30000")
    assert Decimal(body["previous"]["total_sales"]) == Decimal("70000")
    assert body["previous"]["order_count"] == 1

    sellers = body["best_sellers"]
    assert [s["title"] for s in sellers] == ["Hoodie", "Handmade cup"]
    assert sellers[0]["quantity"] == 3 and Decimal(sellers[0]["revenue"]) == Decimal("150000")
    assert sellers[1]["product_id"] is None and sellers[1]["quantity"] == 3


def test_sales_report_defaults_to_current_month_with_no_next(client, public_store):
    res = client.get("/api/v1/seller/reports/sales", headers=public_store["seller_headers"])
    assert res.status_code == 200
    body = res.json()
    jy, jm = jalali.current_month()
    assert body["month"] == jalali.month_key(jy, jm)
    assert body["next_month"] is None
    assert body["order_count"] == 0
    assert Decimal(body["average_order_value"]) == 0


def test_sales_report_rejects_bad_month(client, public_store):
    res = client.get("/api/v1/seller/reports/sales?month=2025-13", headers=public_store["seller_headers"])
    assert res.status_code == 422


def test_sales_report_is_basic_plus(client, other_seller_headers):
    res = client.get("/api/v1/seller/reports/sales", headers=other_seller_headers)
    _forbidden_by_plan(res, "sales_report")


# --- 2. Excel export on Basic ---------------------------------------------


def test_orders_excel_export_on_basic_is_excel_friendly(client, public_store, db):
    store = _store(db)
    _order(db, store, public_store["payment_method_id"], total="40000", manual=True, name="=cmd()")
    res = client.get("/api/v1/seller/exports/orders.csv", headers=public_store["seller_headers"])
    assert res.status_code == 200
    text = res.content.decode("utf-8")
    assert text.startswith("﻿"), "Excel needs a BOM to read Persian text"
    rows = list(csv.reader(io.StringIO(text.lstrip("﻿"))))
    assert rows[0][-1] == "is_manual"
    assert rows[1][3] == "'=cmd()"  # formula injection neutralised
    assert rows[1][-1] == "True"


def test_orders_excel_export_not_on_free(client, other_seller_headers):
    res = client.get("/api/v1/seller/exports/orders.csv", headers=other_seller_headers)
    _forbidden_by_plan(res, "excel_export")


def test_plan_catalog_gates():
    seeds = {p["code"]: p["entitlements"] for p in entitlement_service.PLAN_SEEDS}
    assert not seeds["free"]["excel_export"] and seeds["basic"]["excel_export"]
    for key in ("sales_report", "customer_list"):
        assert not seeds["free"][key] and seeds["basic"][key] and seeds["pro"][key]
    for key in ("customer_tags", "customer_export", "remove_nisha_watermark"):
        assert not seeds["basic"][key] and seeds["pro"][key] and seeds["enterprise"][key]


# --- 3. Customer list ------------------------------------------------------


def test_customer_list_totals_and_repeat_buyers(client, public_store, db):
    store = _store(db)
    pm = public_store["payment_method_id"]
    _order(db, store, pm, total="100000", phone="09121111111", name="Repeat")
    _order(db, store, pm, total="50000", phone="09121111111", name="Repeat", manual=True)
    _order(db, store, pm, total="70000", phone="09121111111", name="Repeat", status=OrderStatus.CANCELLED)
    _order(db, store, pm, total="20000", phone="09122222222", name="Once")

    res = client.get("/api/v1/seller/customers", headers=public_store["seller_headers"])
    assert res.status_code == 200, res.text
    by_phone = {c["phone"]: c for c in res.json()["items"]}
    repeat = by_phone["09121111111"]
    assert repeat["order_count"] == 3
    assert repeat["paid_order_count"] == 2
    assert Decimal(repeat["total_spent"]) == Decimal("150000")
    assert repeat["is_repeat"] is True
    assert by_phone["09122222222"]["is_repeat"] is False
    assert repeat["last_order_at"]

    only = client.get("/api/v1/seller/customers?repeat_only=true", headers=public_store["seller_headers"])
    assert [c["phone"] for c in only.json()["items"]] == ["09121111111"]

    detail = client.get("/api/v1/seller/customers/g:09121111111", headers=public_store["seller_headers"])
    assert detail.status_code == 200
    assert detail.json()["is_repeat"] is True
    assert Decimal(detail.json()["total_spent"]) == Decimal("150000")


def test_customer_list_is_basic_plus(client, other_seller_headers):
    res = client.get("/api/v1/seller/customers", headers=other_seller_headers)
    _forbidden_by_plan(res, "customer_list")


def test_customer_tags_are_pro(client, public_store, db):
    store = _store(db)
    _order(db, store, public_store["payment_method_id"], total="10000", phone="09123333333")
    headers = public_store["seller_headers"]

    basic = client.put("/api/v1/seller/customers/g:09123333333/tags", headers=headers, json={"tags": ["VIP"]})
    _forbidden_by_plan(basic, "customer_tags")
    _forbidden_by_plan(client.get("/api/v1/seller/customers/tags", headers=headers), "customer_tags")

    _set_plan(db, store, "pro")
    res = client.put(
        "/api/v1/seller/customers/g:09123333333/tags",
        headers=headers,
        json={"tags": [" VIP ", "VIP", "عمده‌فروش", ""]},
    )
    assert res.status_code == 200, res.text
    assert res.json() == {"key": "g:09123333333", "tags": ["VIP", "عمده‌فروش"]}

    listed = client.get("/api/v1/seller/customers?tag=VIP", headers=headers).json()["items"]
    assert [c["phone"] for c in listed] == ["09123333333"]
    assert listed[0]["tags"] == ["VIP", "عمده‌فروش"]
    assert client.get("/api/v1/seller/customers/tags", headers=headers).json() == ["VIP", "عمده‌فروش"]

    too_many = client.put(
        "/api/v1/seller/customers/g:09123333333/tags",
        headers=headers,
        json={"tags": [f"t{i}" for i in range(11)]},
    )
    assert too_many.status_code == 422
    unknown = client.put("/api/v1/seller/customers/g:09129999999/tags", headers=headers, json={"tags": ["x"]})
    assert unknown.status_code == 404


def test_customer_tags_stay_inside_the_store(client, public_store, other_seller_headers, db):
    store = _store(db)
    _order(db, store, public_store["payment_method_id"], total="10000", phone="09124444444")
    other = _store(db, "seller-b")
    _set_plan(db, other, "pro")
    res = client.put("/api/v1/seller/customers/g:09124444444/tags", headers=other_seller_headers, json={"tags": ["x"]})
    assert res.status_code == 404


def test_customer_excel_export_is_pro(client, public_store, db):
    store = _store(db)
    _order(db, store, public_store["payment_method_id"], total="25000", phone="09125555555", name="Sara")
    headers = public_store["seller_headers"]
    _forbidden_by_plan(client.get("/api/v1/seller/exports/customers.csv", headers=headers), "customer_export")

    _set_plan(db, store, "pro")
    client.put("/api/v1/seller/customers/g:09125555555/tags", headers=headers, json={"tags": ["VIP"]})
    res = client.get("/api/v1/seller/exports/customers.csv", headers=headers)
    assert res.status_code == 200
    rows = list(csv.reader(io.StringIO(res.content.decode("utf-8").lstrip("﻿"))))
    assert rows[0][:2] == ["name", "phone"]
    assert rows[1][0] == "Sara" and rows[1][1] == "09125555555"
    assert rows[1][6] == "25000.00" and rows[1][-1] == "VIP"


# --- 4. Branding toggle ----------------------------------------------------


def test_branding_toggle_is_pro_and_reaches_the_storefront(client, public_store, db):
    headers = public_store["seller_headers"]
    slug = public_store["slug"]
    store = _store(db)

    basic = client.put("/api/v1/seller/store", headers=headers, json={"hide_nisha_branding": True})
    _forbidden_by_plan(basic, "remove_nisha_watermark")
    page = client.get(f"/api/v1/public/stores/{slug}").json()["store"]
    assert page["hide_nisha_branding"] is False

    _set_plan(db, store, "pro")
    on = client.put("/api/v1/seller/store", headers=headers, json={"hide_nisha_branding": True})
    assert on.status_code == 200 and on.json()["hide_nisha_branding"] is True
    page = client.get(f"/api/v1/public/stores/{slug}").json()["store"]
    assert page["hide_nisha_branding"] is True
    assert page["remove_nisha_watermark"] is True  # share cards follow the toggle

    # Pro without the toggle keeps branding.
    client.put("/api/v1/seller/store", headers=headers, json={"hide_nisha_branding": False})
    page = client.get(f"/api/v1/public/stores/{slug}").json()["store"]
    assert page["hide_nisha_branding"] is False and page["remove_nisha_watermark"] is False

    # A lapsed plan brings branding back without touching the saved setting.
    client.put("/api/v1/seller/store", headers=headers, json={"hide_nisha_branding": True})
    sub = db.scalar(select(SellerSubscription).where(SellerSubscription.seller_user_id == store.owner_id))
    sub.current_period_end = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()
    page = client.get(f"/api/v1/public/stores/{slug}").json()["store"]
    assert page["hide_nisha_branding"] is False
    owner = db.get(User, store.owner_id)
    assert owner is not None
    db.refresh(store)
    assert store.hide_nisha_branding is True
