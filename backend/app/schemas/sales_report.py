from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.analytics import TopProductItem


class SalesReportTotals(BaseModel):
    orders: int
    revenue: Decimal
    average_order_value: Decimal
    manual_orders: int
    repeat_buyers: int


class SalesReportResponse(BaseModel):
    days: int
    totals: SalesReportTotals
    top_products: list[TopProductItem] = Field(default_factory=list)
