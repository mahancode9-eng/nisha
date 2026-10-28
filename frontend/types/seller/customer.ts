import type { OrderStatus } from "@/types/order";
import type { CustomerTag } from "@/types/seller/customer-tag";

export type SellerCustomerKind = "account" | "guest";

export type SellerCustomerOrderItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  total_amount: string;
  buyer_address: string | null;
  created_at: string;
};

export type SellerCustomerListItem = {
  key: string;
  kind: SellerCustomerKind;
  customer_id: number | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  order_count: number;
  last_order_at: string | null;
  has_conversation: boolean;
  conversation_id: number | null;
  tags?: CustomerTag[];
};

export type SellerCustomerDetail = SellerCustomerListItem & {
  postal_code: string | null;
  last_address: string | null;
  orders: SellerCustomerOrderItem[];
};

export type ListSellerCustomersParams = {
  search?: string;
  page?: number;
  page_size?: number;
};
