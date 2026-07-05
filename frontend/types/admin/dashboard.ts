import type { OrderStatus } from "@/types/order";

export type AdminRecentOrderItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  total_amount: string;
  store_name: string;
  store_slug: string;
  buyer_name: string;
  created_at: string;
};

export type AdminDashboard = {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;
  total_sellers: number;
  total_products: number;
  total_orders: number;
  confirmed_revenue: string;
  pending_revenue: string;
  recent_orders: AdminRecentOrderItem[];
};
