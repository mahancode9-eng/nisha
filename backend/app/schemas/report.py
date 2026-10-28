from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class BestSellingProduct(BaseModel):
    product_id: int | None = None
    title: str
    quantity: int
    revenue: Decimal


class MonthTotals(BaseModel):
    total_sales: Decimal = Decimal("0")
    order_count: int = 0


class SalesReportResponse(BaseModel):
    """One Jalali month of paid sales (confirmed, preparing, shipped, delivered)."""

    month: str  # "1404-08"
    month_label: str  # "آبان 1404"
    previous_month: str
    next_month: str | None = None  # None while the month is still running
    total_sales: Decimal = Decimal("0")
    order_count: int = 0
    average_order_value: Decimal = Decimal("0")
    manual_order_count: int = 0
    manual_sales: Decimal = Decimal("0")
    best_sellers: list[BestSellingProduct] = Field(default_factory=list)
    previous: MonthTotals = Field(default_factory=MonthTotals)
