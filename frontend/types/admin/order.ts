import type { OrderStatus } from "@/types/order";
import type { ConversationDetail } from "@/types/chat";
import type { CustomerComplaint } from "@/types/customer/order";
import type { CustomerProfile } from "@/types/customer/profile";
import type { PaymentMethod } from "@/types/seller/payment-method";
import type {
  OrderStatusHistory,
  PaymentProof,
  SellerOrderItem,
} from "@/types/seller/order";

export type AdminOrderListItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  total_amount: string;
  store_id: number;
  store_name: string;
  store_slug: string;
  customer_id: number | null;
  receipt_status: "RECEIVED" | "NOT_RECEIVED" | null;
  complaint_count: number;
  created_at: string;
};

export type AdminOrderFieldValue = {
  field_key: string;
  field_label: string;
  field_type: string;
  sort_order: number;
  value_text: string | null;
  value_json: unknown | null;
  file_url: string | null;
  field_snapshot: Record<string, unknown> | null;
};

export type AdminOrderItemSubmission = {
  item_id: number;
  product_id: number | null;
  product_title_snapshot: string;
  field_values: AdminOrderFieldValue[];
};

export type AdminAuditLog = {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  entity_label: string | null;
  note: string | null;
  details: Record<string, unknown>;
  actor_user_id: number | null;
  actor_name: string | null;
  created_at: string;
};

export type AdminOrderDetail = {
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
  customer: CustomerProfile | null;
  invoice_username: string;
  invoice_password: string | null;
  receipt_status: "RECEIVED" | "NOT_RECEIVED" | null;
  complaint_count: number;
  stock_restored: boolean;
  store_id: number;
  store_name: string;
  store_slug: string;
  created_at: string;
  updated_at: string;
  items: SellerOrderItem[];
  submissions: AdminOrderItemSubmission[];
  complaints: CustomerComplaint[];
  conversation_id: number | null;
  conversation: ConversationDetail | null;
  audit_logs: AdminAuditLog[];
  payment_method: PaymentMethod;
  payment_proofs: PaymentProof[];
  status_history: OrderStatusHistory[];
};

export type ListAdminOrdersParams = {
  store_id?: number;
  status?: OrderStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
};

export type AdminOrderUpdateRequest = {
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_address?: string | null;
  buyer_note?: string | null;
  status?: OrderStatus | null;
  note?: string | null;
};
