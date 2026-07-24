from __future__ import annotations

import json
from typing import Any

from app.models.order import OrderItem
from app.models.product import OrderItemFieldValue
from app.schemas.customer_portal import CustomerOrderItemResponse
from app.schemas.guest_order import OrderTrackItemResponse
from app.schemas.order_item import OrderItemFieldValueResponse
from app.schemas.seller_order import SellerOrderItemResponse


def parse_json_field(raw: str | None) -> Any | None:
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def field_value_response(field_value: OrderItemFieldValue) -> OrderItemFieldValueResponse:
    return OrderItemFieldValueResponse(
        field_key=field_value.field_key,
        field_label=field_value.field_label,
        field_type=field_value.field_type,
        sort_order=field_value.sort_order,
        value_text=field_value.value_text,
        value_json=parse_json_field(field_value.value_json),
        file_url=field_value.file_url,
        field_snapshot=parse_json_field(field_value.field_snapshot_json),
    )


def seller_order_item_response(item: OrderItem) -> SellerOrderItemResponse:
    return SellerOrderItemResponse(
        id=item.id,
        product_id=item.product_id,
        variant_id=item.variant_id,
        variant_name_snapshot=item.variant_name_snapshot,
        product_title_snapshot=item.product_title_snapshot,
        unit_price_snapshot=item.unit_price_snapshot,
        quantity=item.quantity,
        total_price=item.total_price,
        field_values=[field_value_response(field_value) for field_value in item.field_values],
    )


def customer_order_item_response(item: OrderItem) -> CustomerOrderItemResponse:
    return CustomerOrderItemResponse(
        id=item.id,
        product_id=item.product_id,
        variant_id=item.variant_id,
        variant_name_snapshot=item.variant_name_snapshot,
        product_title_snapshot=item.product_title_snapshot,
        unit_price_snapshot=item.unit_price_snapshot,
        quantity=item.quantity,
        total_price=item.total_price,
        field_values=[field_value_response(field_value) for field_value in item.field_values],
    )


def track_order_item_response(item: OrderItem) -> OrderTrackItemResponse:
    return OrderTrackItemResponse(
        product_id=item.product_id,
        product_title=item.product_title_snapshot,
        variant_name=item.variant_name_snapshot,
        quantity=item.quantity,
        unit_price=item.unit_price_snapshot,
        total_price=item.total_price,
        field_values=[field_value_response(field_value) for field_value in item.field_values],
    )
