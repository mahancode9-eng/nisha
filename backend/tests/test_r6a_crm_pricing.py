"""R6a: sales report, customer tags, compare_at_price."""

from decimal import Decimal

from app.models.enums import BillingPeriod, OrderStatus
from app.models.order import Order
from app.services import subscription_billing_service


def test_compare_at_price_on_product(client, public_store):
    res = client.post(
        "/api/v1/seller/products",
        headers=public_store["seller_headers"],
        json={
            "title": "Sale Hoodie",
            "price": "200000",
            "compare_at_price": "280000",
            "stock_quantity": 5,
            "is_active": True,
        },
    )
    assert res.status_code == 201
    assert Decimal(res.json()["compare_at_price"]) == Decimal("280000")

    public = client.get(
        f"/api/v1/public/stores/{public_store['slug']}/products/{res.json()['id']}"
    )
    assert public.status_code == 200
    assert Decimal(public.json()["product"]["compare_at_price"]) == Decimal("280000")


def test_sales_report_basic(client, public_store, placed_order, db):
    order = db.get(Order, placed_order["order_id"])
    assert order is not None
    order.status = OrderStatus.PAYMENT_CONFIRMED
    db.commit()

    res = client.get(
        "/api/v1/seller/reports/sales?days=30",
        headers=public_store["seller_headers"],
    )
    assert res.status_code == 200
    body = res.json()
    assert body["totals"]["orders"] >= 1
    assert Decimal(body["totals"]["revenue"]) > 0
    assert Decimal(body["totals"]["average_order_value"]) > 0


def test_customer_tags_require_pro(client, public_store, placed_order, db):
    # public_store is Basic — tags locked.
    locked = client.post(
        "/api/v1/seller/customer-tags",
        headers=public_store["seller_headers"],
        json={"name": "VIP"},
    )
    assert locked.status_code == 403

    from app.models.user import User
    from app.services.auth_service import normalize_email
    from sqlalchemy import select

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

    created = client.post(
        "/api/v1/seller/customer-tags",
        headers=public_store["seller_headers"],
        json={"name": "VIP", "color": "#112233"},
    )
    assert created.status_code == 201
    tag_id = created.json()["id"]

    customers = client.get(
        "/api/v1/seller/customers",
        headers=public_store["seller_headers"],
    )
    assert customers.status_code == 200
    items = customers.json()["items"]
    assert items
    assert "total_spent" in items[0]
    assert "is_repeat" in items[0]
    key = items[0]["key"]

    assigned = client.put(
        f"/api/v1/seller/customer-tags/customers/{key}",
        headers=public_store["seller_headers"],
        json={"tag_ids": [tag_id]},
    )
    assert assigned.status_code == 200
    assert assigned.json()[0]["name"] == "VIP"

    filtered = client.get(
        f"/api/v1/seller/customers?tag_id={tag_id}",
        headers=public_store["seller_headers"],
    )
    assert filtered.status_code == 200
    assert any(item["key"] == key for item in filtered.json()["items"])
