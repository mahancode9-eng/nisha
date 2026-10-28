from app.models.enums import OrderStatus
from app.models.order import Order


def _place_order(client, public_store, quantity=1):
    return client.post(
        f"/api/v1/public/stores/{public_store['slug']}/orders",
        json={
            "buyer_name": "Buyer",
            "buyer_phone": "+989120000000",
            "buyer_address": "Address",
            "payment_method_id": public_store["payment_method_id"],
            "items": [{"product_id": public_store["product_id"], "quantity": quantity}],
        },
    )


def test_list_orders_filters_by_statuses(client, public_store, db):
    pending = _place_order(client, public_store).json()["order_id"]
    confirmed = _place_order(client, public_store).json()["order_id"]
    client.post(
        f"/api/v1/seller/orders/{confirmed}/confirm-payment",
        headers=public_store["seller_headers"],
    )

    uploaded = db.get(Order, pending)
    uploaded.status = OrderStatus.PAYMENT_UPLOADED
    db.commit()

    proof = client.get(
        "/api/v1/seller/orders",
        headers=public_store["seller_headers"],
        params=[
            ("statuses", "PENDING_PAYMENT"),
            ("statuses", "PAYMENT_UPLOADED"),
            ("statuses", "PAYMENT_REJECTED"),
        ],
    )
    assert proof.status_code == 200
    proof_ids = {item["id"] for item in proof.json()["items"]}
    assert pending in proof_ids
    assert confirmed not in proof_ids
    assert proof.json()["items"][0]["id"] == pending
    assert proof.json()["items"][0]["payment_proof_count"] == 0

    prep = client.get(
        "/api/v1/seller/orders",
        headers=public_store["seller_headers"],
        params=[("statuses", "PAYMENT_CONFIRMED"), ("statuses", "PREPARING")],
    )
    assert prep.status_code == 200
    prep_ids = {item["id"] for item in prep.json()["items"]}
    assert confirmed in prep_ids
    assert pending not in prep_ids


def test_open_order_conversation(client, public_store, placed_order):
    order_id = placed_order["order_id"]
    first = client.post(
        f"/api/v1/seller/orders/{order_id}/conversation",
        headers=public_store["seller_headers"],
    )
    assert first.status_code == 200
    conversation_id = first.json()["conversation_id"]
    assert isinstance(conversation_id, int)

    listed = client.get(
        "/api/v1/seller/orders",
        headers=public_store["seller_headers"],
        params={"status": "PENDING_PAYMENT"},
    )
    assert listed.status_code == 200
    match = next(item for item in listed.json()["items"] if item["id"] == order_id)
    assert match["conversation_id"] == conversation_id

    second = client.post(
        f"/api/v1/seller/orders/{order_id}/conversation",
        headers=public_store["seller_headers"],
    )
    assert second.status_code == 200
    assert second.json()["conversation_id"] == conversation_id
