"""R4b: DM reply templates persist on the store."""


def test_dm_reply_templates_roundtrip(client, seller_headers):
    save = client.put(
        "/api/v1/seller/store",
        headers=seller_headers,
        json={
            "dm_reply_templates": [
                {"title": "سلام", "body": "سلام، سفارشت ثبت شد."},
                {"title": "آدرس", "body": "آدرس تحویل رو بفرست."},
            ]
        },
    )
    assert save.status_code == 200
    templates = save.json().get("dm_reply_templates") or []
    assert len(templates) == 2
    assert templates[0]["title"] == "سلام"

    again = client.get("/api/v1/seller/store", headers=seller_headers)
    assert again.status_code == 200
    assert len(again.json().get("dm_reply_templates") or []) == 2
