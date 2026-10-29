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
  conversation_id?: number | null;
  payment_proof_count?: number;
  is_manual?: boolean;
  created_at: string;
};

export type SellerOrderItem = {
  id: number;
  product_id: number | null;
  variant_id?: number | null;
  variant_name_snapshot?: string | null;
  product_title_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  total_price: string;
  field_values?: import("@/types/order-item").OrderItemFieldValue[];
};

export type PaymentProof = {
  id: number;
  image_url: string;
  payer_card_last4?: string | null;
  transfer_tracking?: string | null;
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
  discount_code?: string | null;
  discount_amount?: string;
  shipping_amount?: string;
  total_amount: string;
  customer_id: number | null;
  receipt_status: "RECEIVED" | "NOT_RECEIVED" | null;
  complaint_count: number;
  conversation_id?: number | null;
  payment_proof_count?: number;
  stock_restored: boolean;
  tracking_code?: string | null;
  is_manual?: boolean;
  shipping_method_id?: number | null;
  shipping_method_name?: string | null;
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
  tracking_code?: string | null;
};

export type SellerOrderConversationResponse = {
  conversation_id: number;
};

export type OrderStatusPatch = "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type ListOrdersParams = {
  status?: OrderStatus;
  statuses?: OrderStatus[];
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
};
