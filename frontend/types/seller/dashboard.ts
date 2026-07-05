import type { OrderStatus } from "@/types/order";
import type { SellerOnboardingStatus, SellerOnboardingStepKey } from "@/types/seller/onboarding";

export type LowStockProductItem = {
  id: number;
  title: string;
  stock_quantity: number;
  price: string;
};

export type RecentOrderItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  total_amount: string;
  created_at: string;
};

export type SellerDashboardResponse = {
  store_readiness_score: number;
  store_readiness_missing_tasks: string[];
  onboarding_status: SellerOnboardingStatus;
  onboarding_current_step: SellerOnboardingStepKey | null;
  onboarding_completed_at: string | null;
  total_orders: number;
  pending_orders: number;
  payment_uploaded_orders: number;
  confirmed_orders: number;
  confirmed_revenue: string;
  pending_revenue: string;
  today_revenue: string;
  low_stock_products: LowStockProductItem[];
  recent_orders: RecentOrderItem[];
};
