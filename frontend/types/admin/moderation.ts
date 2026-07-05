import type { StoreBadgeType } from "@/types/store";
import type { ConversationDetail, ConversationListItem } from "@/types/chat";

export type AdminStoreBadge = {
  badge_type: StoreBadgeType;
  is_active: boolean;
  assigned_at: string | null;
  removed_at: string | null;
  assigned_by_user_id: number | null;
};

export type AdminStoreBadgeHistoryItem = {
  id: number;
  store_id: number;
  badge_type: StoreBadgeType;
  action: string;
  note: string | null;
  admin_user_id: number | null;
  created_at: string;
};

export type AdminReviewListItem = {
  id: number;
  order_id: number;
  store_id: number;
  customer_id: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "PRIVATE" | "PENDING" | "APPROVED" | "REJECTED";
  image_urls: string[];
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminReviewModerationRequest = {
  status: "PRIVATE" | "PENDING" | "APPROVED" | "REJECTED";
  moderation_note?: string | null;
};

export type AdminChatListItem = ConversationListItem;
export type AdminChatDetail = ConversationDetail;
