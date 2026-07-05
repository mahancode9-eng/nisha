import type { OrderStatus } from "@/types/order";
import type { PublicPaymentMethod, PublicStoreProfile } from "@/types/public/store";
import type { PublicPaymentProof } from "@/types/public/order";
import type { CustomerAddress, CustomerProfile } from "@/types/customer/profile";
import type { OrderItemInput } from "@/types/public/checkout";

export type CustomerReceiptStatus = "RECEIVED" | "NOT_RECEIVED" | null;

export type CustomerOrderListItem = {
  id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  total_amount: string;
  customer_id: number | null;
  receipt_status: CustomerReceiptStatus;
  complaint_count: number;
  created_at: string;
};

export type CustomerOrderDetail = {
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
  receipt_status: CustomerReceiptStatus;
  complaint_count: number;
  stock_restored: boolean;
  created_at: string;
  updated_at: string;
  items: {
    id: number | null;
    product_id: number | null;
    product_title_snapshot: string;
    unit_price_snapshot: string;
    quantity: number;
    total_price: string;
  }[];
  payment_method: PublicPaymentMethod;
  payment_proofs: PublicPaymentProof[];
  status_history: {
    id: number;
    old_status: OrderStatus | null;
    new_status: OrderStatus;
    note: string | null;
    created_at: string;
  }[];
  store: PublicStoreProfile;
};

export type CustomerOrderActionResponse = {
  message: string;
  order_id: number;
  status: OrderStatus | null;
  receipt_status: CustomerReceiptStatus;
};

export type CustomerOrderClaimRequest = {
  invoice_code: string;
  invoice_password: string;
};

export type CustomerOrderReceiptUpdateRequest = {
  receipt_status: "RECEIVED" | "NOT_RECEIVED";
};

export type CustomerComplaintCreateRequest = {
  reason?: string;
  message: string;
};

export type CustomerComplaint = {
  id: number;
  order_id: number;
  reason: string;
  message: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  seller_notified_at: string | null;
  admin_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerReviewCreateRequest = {
  order_id: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_public?: boolean;
  image_urls?: string[];
};

export type CustomerReview = {
  id: number;
  order_id: number;
  store_id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "PRIVATE" | "PENDING" | "APPROVED" | "REJECTED";
  image_urls: string[];
  is_public: boolean;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerCheckoutCreate = {
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note?: string | null;
  payment_method_id: number;
  items: OrderItemInput[];
  save_address?: boolean;
  address_label?: string | null;
  postal_code?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
};

export type CustomerDashboardSummary = {
  total_orders: number;
  active_orders: number;
  complaints: number;
  downloads: number;
  chats: number;
  reviews: number;
  recent_orders: CustomerOrderListItem[];
  profile: CustomerProfile;
  addresses: CustomerAddress[];
};
