import json

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem


def test_store_social_links_public_filtering_and_order(client, seller_headers):
    first = client.post(
        "/api/v1/seller/store/social-links",
        headers=seller_headers,
        json={
            "label": "Telegram",
            "url": "https://t.me/seller",
            "icon_key": "telegram",
            "sort_order": 0,
            "is_active": True,
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/seller/store/social-links",
        headers=seller_headers,
        json={
            "label": "Instagram",
            "url": "https://instagram.com/seller",
            "icon_key": "instagram",
            "sort_order": 1,
            "is_active": False,
        },
    )
    assert second.status_code == 201

    reorder = client.patch(
        "/api/v1/seller/store/social-links/reorder",
        headers=seller_headers,
        json={"ordered_ids": [second.json()["id"], first.json()["id"]]},
    )
    assert reorder.status_code == 200
    assert reorder.json()[0]["label"] == "Instagram"

    public_store = client.get("/api/v1/public/stores/seller-a")
    assert public_store.status_code == 200
    links = public_store.json()["social_links"]
    assert [link["label"] for link in links] == ["Telegram"]


def test_public_image_upload_generates_thumbnail(client):
    from tests.conftest import PNG_BYTES

    response = client.post(
        "/api/v1/public/uploads/images",
        files={"file": ("logo.png", PNG_BYTES, "image/png")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["url"].startswith("/uploads/media/")
    assert data["thumbnail_url"].endswith("_thumb.webp")
    assert data["width"] == 1
    assert data["height"] == 1


def test_gallery_order_and_field_snapshot_persistence(client, seller_headers, public_store, db):
    create = client.post(
        "/api/v1/seller/products",
        headers=seller_headers,
        json={
            "title": "Custom Mug",
            "description": "Made to order",
            "price": "25.00",
            "stock_quantity": 5,
            "is_active": True,
            "images": [
                {
                    "image_url": "https://cdn.example.com/mug-a.jpg",
                    "sort_order": 0,
                },
                {
                    "image_url": "https://cdn.example.com/mug-b.jpg",
                    "sort_order": 1,
                },
            ],
            "form_fields": [
                {
                    "field_key": "engraving",
                    "label": "Engraving",
                    "field_type": "TEXT",
                    "sort_order": 0,
                    "is_required": True,
                }
            ],
        },
    )
    assert create.status_code == 201
    product_id = create.json()["id"]
    image_ids = [image["id"] for image in create.json()["images"]]

    reorder = client.patch(
        f"/api/v1/seller/products/{product_id}/images/reorder",
        headers=seller_headers,
        json={"ordered_ids": [image_ids[1], image_ids[0]]},
    )
    assert reorder.status_code == 200
    assert reorder.json()[0]["image_url"].endswith("mug-b.jpg")

    order = client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Ali Customer",
            "buyer_phone": "+989121111111",
            "buyer_address": "Tehran, Iran",
            "payment_method_id": public_store["payment_method_id"],
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 1,
                    "field_values": [
                        {
                            "field_key": "engraving",
                            "value": "For Mom",
                        }
                    ],
                }
            ],
        },
    )
    assert order.status_code == 201
    order_id = order.json()["order_id"]

    update = client.put(
        f"/api/v1/seller/products/{product_id}",
        headers=seller_headers,
        json={
            "form_fields": [
                {
                    "field_key": "engraving",
                    "label": "Gift Message",
                    "field_type": "TEXT",
                    "sort_order": 0,
                    "is_required": True,
                }
            ]
        },
    )
    assert update.status_code == 200

    persisted = db.scalar(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.field_values))
        .where(Order.id == order_id)
    )
    assert persisted is not None
    assert persisted.items[0].field_values[0].field_label == "Engraving"
    snapshot = json.loads(persisted.items[0].field_values[0].field_snapshot_json)
    assert snapshot["label"] == "Engraving"
    assert persisted.items[0].field_values[0].value_text == "For Mom"
