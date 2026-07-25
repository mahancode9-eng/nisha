from app.models.enums import OrderStatus
from app.models.order import Order

# Minimal valid 1x1 PNG (avoid importing tests.conftest which clashes with site-packages)
PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_upload_payment_proof_success(client, placed_order, db):
    response = client.post(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
        data={"invoice_edit_password": placed_order["password"]},
        files={"file": ("proof.png", PNG_BYTES, "image/png")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["order_status"] == "PAYMENT_UPLOADED"
    assert data["proof"]["image_url"].startswith("/api/v1/media/private/payment-proofs/")
    assert "token=" in data["proof"]["image_url"]

    # Unsigned private path must not be world-readable.
    stored = data["proof"]["image_url"].split("?")[0]
    assert client.get(stored).status_code == 401
    # Signed URL works.
    assert client.get(data["proof"]["image_url"]).status_code == 200

    order = db.get(Order, placed_order["order_id"])
    assert order.status == OrderStatus.PAYMENT_UPLOADED
    assert order.reservation_expires_at is None


def test_upload_wrong_password(client, placed_order):
    response = client.post(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
        data={"invoice_edit_password": "wrong-password"},
        files={"file": ("proof.png", PNG_BYTES, "image/png")},
    )
    assert response.status_code == 401


def test_upload_file_too_large(client, placed_order, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "MAX_UPLOAD_SIZE_BYTES", 50)

    response = client.post(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
        data={"invoice_edit_password": placed_order["password"]},
        files={"file": ("proof.png", PNG_BYTES, "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "حجم فایل بیش از حد مجاز است"


def test_track_includes_payment_proofs_shape(client, placed_order):
    response = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_edit_password": placed_order["password"],
        },
    )
    assert response.status_code == 200
    assert "payment_proofs" in response.json()
    assert isinstance(response.json()["payment_proofs"], list)


def test_upload_non_image(client, placed_order):
    response = client.post(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/upload-payment-proof",
        data={"invoice_edit_password": placed_order["password"]},
        files={"file": ("notes.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 422


def test_track_order_success(client, placed_order):
    response = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_edit_password": placed_order["password"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["invoice_code"] == placed_order["invoice_code"]
    assert len(data["items"]) == 1
    assert data["store"]["slug"] == placed_order["slug"]


def test_track_wrong_password(client, placed_order):
    response = client.post(
        "/api/v1/public/orders/track",
        json={
            "invoice_code": placed_order["invoice_code"],
            "invoice_edit_password": "wrong-password",
        },
    )
    assert response.status_code == 401


def test_edit_allowed_before_confirmation(client, placed_order):
    response = client.patch(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/edit",
        json={
            "invoice_edit_password": placed_order["password"],
            "buyer_name": "Updated Name",
        },
    )

    assert response.status_code == 200
    assert response.json()["buyer_name"] == "Updated Name"


def test_edit_blocked_after_confirmation(client, placed_order, db):
    order = db.get(Order, placed_order["order_id"])
    order.status = OrderStatus.PAYMENT_CONFIRMED
    db.commit()

    response = client.patch(
        f"/api/v1/public/orders/{placed_order['invoice_code']}/edit",
        json={
            "invoice_edit_password": placed_order["password"],
            "buyer_name": "Should Fail",
        },
    )
    assert response.status_code == 422
