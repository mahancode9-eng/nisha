import { apiGet, apiPatch } from "@/lib/api/client";
import type { ConversationDetail } from "@/types/chat";
import type { PaginatedResponse } from "@/types/api/pagination";
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderUpdateRequest,
  ListAdminOrdersParams,
} from "@/types/admin/order";

function buildQuery(params: ListAdminOrdersParams): string {
  const q = new URLSearchParams();
  if (params.store_id) q.set("store_id", String(params.store_id));
  if (params.status) q.set("status", params.status);
  if (params.date_from) q.set("date_from", params.date_from);
  if (params.date_to) q.set("date_to", params.date_to);
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function listOrders(
  params: ListAdminOrdersParams = {},
): Promise<PaginatedResponse<AdminOrderListItem>> {
  return apiGet<PaginatedResponse<AdminOrderListItem>>(
    `/api/v1/admin/orders${buildQuery(params)}`,
  );
}

export function getOrder(id: number): Promise<AdminOrderDetail> {
  return apiGet<AdminOrderDetail>(`/api/v1/admin/orders/${id}`);
}

export function getOrderChat(id: number): Promise<ConversationDetail> {
  return apiGet<ConversationDetail>(`/api/v1/admin/orders/${id}/chat`);
}

export function updateOrder(
  id: number,
  body: AdminOrderUpdateRequest,
): Promise<AdminOrderDetail> {
  return apiPatch<AdminOrderDetail>(`/api/v1/admin/orders/${id}`, body);
}
