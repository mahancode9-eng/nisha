from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ShippingLineInput:
    product_id: int
    quantity: int
    shipping_cost: Decimal | None


def compute_shipping_amount(
    *,
    subtotal: Decimal,
    default_shipping_cost: Decimal,
    free_shipping_min_subtotal: Decimal | None,
    lines: list[ShippingLineInput],
) -> Decimal:
    """Compute checkout shipping from store defaults and optional per-product fees."""
    product_lines = [line for line in lines if line.shipping_cost is not None]
    if product_lines:
        return sum(
            (Decimal(line.shipping_cost) * line.quantity for line in product_lines),
            Decimal("0"),
        )

    if (
        free_shipping_min_subtotal is not None
        and subtotal >= Decimal(free_shipping_min_subtotal)
    ):
        return Decimal("0")
    return Decimal(default_shipping_cost)
