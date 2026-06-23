from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import OrderStatus, StoreOnboardingStatus, StoreOnboardingStep


class LowStockProductItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    stock_quantity: int
    price: Decimal


class RecentOrderItem(BaseModel):
    id: int
    invoice_code: str
    status: OrderStatus
    buyer_name: str
    total_amount: Decimal
    created_at: datetime


class SellerDashboardResponse(BaseModel):
    store_readiness_score: int
    store_readiness_missing_tasks: list[str]
    onboarding_status: StoreOnboardingStatus
    onboarding_current_step: StoreOnboardingStep | None
    onboarding_completed_at: datetime | None
    total_orders: int
    pending_orders: int
    payment_uploaded_orders: int
    confirmed_orders: int
    confirmed_revenue: Decimal
    pending_revenue: Decimal
    today_revenue: Decimal
    low_stock_products: list[LowStockProductItem]
    recent_orders: list[RecentOrderItem]
