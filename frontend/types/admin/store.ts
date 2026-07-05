import type { StoreBadgeType } from "@/types/store";
import type { Store } from "@/types/seller/store";

export type AdminStoreListItem = {
  id: number;
  name: string;
  slug: string;
  owner_email: string;
  is_active: boolean;
  product_count: number;
  order_count: number;
  created_at: string;
};

export type AdminStoreActionResponse = {
  message: string;
  store: AdminStoreListItem;
};

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

export type AdminStoreDetail = {
  store: Store;
  owner_email: string;
  product_count: number;
  order_count: number;
  badges: AdminStoreBadge[];
  badge_history: AdminStoreBadgeHistoryItem[];
  audit_logs: AdminAuditLog[];
};
