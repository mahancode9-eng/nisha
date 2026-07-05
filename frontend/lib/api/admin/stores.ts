import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api/pagination";
import type {
  AdminStoreActionResponse,
  AdminStoreBadge,
  AdminStoreBadgeHistoryItem,
  AdminStoreDetail,
  AdminStoreListItem,
} from "@/types/admin/store";
import type { StoreBadgeType } from "@/types/store";

export function listStores(
  params: PaginationParams = {},
): Promise<PaginatedResponse<AdminStoreListItem>> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const query = q.toString();
  return apiGet<PaginatedResponse<AdminStoreListItem>>(
    `/api/v1/admin/stores${query ? `?${query}` : ""}`,
  );
}

export function activateStore(storeId: number): Promise<AdminStoreActionResponse> {
  return apiPatch<AdminStoreActionResponse>(`/api/v1/admin/stores/${storeId}/activate`);
}

export function deactivateStore(storeId: number): Promise<AdminStoreActionResponse> {
  return apiPatch<AdminStoreActionResponse>(`/api/v1/admin/stores/${storeId}/deactivate`);
}

export function approveStore(storeId: number): Promise<AdminStoreActionResponse> {
  return apiPatch<AdminStoreActionResponse>(`/api/v1/admin/stores/${storeId}/approve`);
}

export function suspendStore(storeId: number): Promise<AdminStoreActionResponse> {
  return apiPatch<AdminStoreActionResponse>(`/api/v1/admin/stores/${storeId}/suspend`);
}

export function getStoreDetail(storeId: number): Promise<AdminStoreDetail> {
  return apiGet<AdminStoreDetail>(`/api/v1/admin/stores/${storeId}`);
}

export function listStoreBadges(storeId: number): Promise<AdminStoreBadge[]> {
  return apiGet<AdminStoreBadge[]>(`/api/v1/admin/stores/${storeId}/badges`);
}

export function assignStoreBadge(
  storeId: number,
  badgeType: StoreBadgeType,
): Promise<AdminStoreBadge> {
  return apiPost<AdminStoreBadge>(`/api/v1/admin/stores/${storeId}/badges/${badgeType}`);
}

export function removeStoreBadge(
  storeId: number,
  badgeType: StoreBadgeType,
): Promise<AdminStoreBadge> {
  return apiDelete<AdminStoreBadge>(`/api/v1/admin/stores/${storeId}/badges/${badgeType}`);
}

export function listStoreBadgeHistory(storeId: number): Promise<AdminStoreBadgeHistoryItem[]> {
  return apiGet<AdminStoreBadgeHistoryItem[]>(`/api/v1/admin/stores/${storeId}/badges/history`);
}
