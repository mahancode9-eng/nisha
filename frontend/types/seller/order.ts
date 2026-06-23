import type { OrderStatus } from "@/types/order";
import type { PaymentMethod } from "@/types/seller/payment-method";

export type SellerOrderListItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  total_amount: string;
  customer_id: number | null;
  receipt_status: "RECEIVED" | "NOT_RECEIVED" | null;
  complaint_count: number;
  created_at: string;
};

export type SellerOrderItem = {
  id: number;
  product_id: number | null;
  product_title_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  total_price: string;
};

export type PaymentProof = {
  id: number;
  image_url: string;
  uploaded_at: string;
};

export type OrderStatusHistory = {
  id: number;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type SellerOrderDetail = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note: string | null;
  subtotal_amount: string;
  total_amount: string;
  customer_id: number | null;
  receipt_status: "RECEIVED" | "NOT_RECEIVED" | null;
  complaint_count: number;
  stock_restored: boolean;
  created_at: string;
  updated_at: string;
  items: SellerOrderItem[];
  payment_method: PaymentMethod;
  payment_proofs: PaymentProof[];
  status_history: OrderStatusHistory[];
};

export type SellerOrderActionResponse = {
  message: string;
  order_id: number;
  status: OrderStatus;
};

export type OrderStatusPatch = "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type ListOrdersParams = {
  status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
};
