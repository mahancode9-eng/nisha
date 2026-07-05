import type { OrderStatus } from "@/types/order";
import type { PublicPaymentMethod, PublicStoreProfile } from "@/types/public/store";

export type OrderTrackRequest = {
  invoice_code: string;
  invoice_edit_password: string;
};

export type OrderTrackItem = {
  product_id: number | null;
  product_title: string;
  quantity: number;
  unit_price: string;
  total_price: string;
};

export type PublicPaymentProof = {
  id: number;
  image_url: string;
  uploaded_at: string;
};

export type OrderTrackResponse = {
  order_id: number;
  invoice_code: string;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note: string | null;
  subtotal_amount: string;
  total_amount: string;
  created_at: string;
  items: OrderTrackItem[];
  payment_proofs: PublicPaymentProof[];
  store: PublicStoreProfile;
  payment_method: PublicPaymentMethod;
};

export type PublicOrderMessageCreateRequest = {
  invoice_code: string;
  invoice_edit_password: string;
  body: string;
  attachment_url?: string | null;
  attachment_mime_type?: string | null;
};

export type PublicOrderChatAuthRequest = {
  invoice_code: string;
  invoice_edit_password: string;
};

export type GuestOrderEdit = {
  invoice_edit_password: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_address?: string;
  buyer_note?: string | null;
};

export type GuestOrderEditResponse = {
  message: string;
  order_id: number;
  status: OrderStatus;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note: string | null;
};

export type PaymentProofUploadResponse = {
  message: string;
  order_status: OrderStatus;
  proof: PublicPaymentProof;
};

export type PublicReviewCreateRequest = {
  invoice_code: string;
  invoice_edit_password: string;
  order_id: number;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_public?: boolean;
  image_urls?: string[];
};
