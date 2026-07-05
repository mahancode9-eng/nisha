import type { OrderStatus } from "@/types/order";

export type SenderType = "SELLER" | "CUSTOMER";

export type Message = {
  id: number;
  conversation_id: number;
  sender_type: SenderType;
  sender_user_id: number | null;
  body: string;
  attachment_url: string | null;
  attachment_mime_type: string | null;
  is_read: boolean;
  created_at: string;
};

export type ConversationListItem = {
  id: number;
  store_id: number;
  store_name: string;
  store_slug: string;
  customer_id: number | null;
  customer_name: string;
  order_id: number | null;
  invoice_code: string | null;
  unread_count: number;
  last_message_body: string | null;
  last_message_at: string | null;
  updated_at: string;
};

export type ConversationDetail = {
  id: number;
  store_id: number;
  store_name: string;
  store_slug: string;
  customer_id: number | null;
  customer_name: string;
  order_id: number | null;
  invoice_code: string | null;
  order_status: OrderStatus | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
};

export type MessageCreate = {
  body: string;
  attachment_url?: string | null;
  attachment_mime_type?: string | null;
};

export type ConversationCreate = {
  store_id?: number | null;
  order_id?: number | null;
};
