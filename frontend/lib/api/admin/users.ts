import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api/pagination";
import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminCustomerUpdate,
  AdminSetPasswordRequest,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserUpdate,
} from "@/types/admin/user";
import type { UserRole } from "@/types/auth";

export function listUsers(
  params: PaginationParams & { role?: UserRole; is_active?: boolean } = {},
): Promise<PaginatedResponse<AdminUserListItem>> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  if (params.role) q.set("role", params.role);
  if (params.is_active !== undefined) q.set("is_active", String(params.is_active));
  const query = q.toString();
  return apiGet<PaginatedResponse<AdminUserListItem>>(
    `/api/v1/admin/users${query ? `?${query}` : ""}`,
  );
}

export function getUser(userId: number): Promise<AdminUserDetail> {
  return apiGet<AdminUserDetail>(`/api/v1/admin/users/${userId}`);
}

export function updateUser(userId: number, payload: AdminUserUpdate): Promise<AdminUserDetail> {
  return apiPatch<AdminUserDetail>(`/api/v1/admin/users/${userId}`, payload);
}

export function setUserPassword(
  userId: number,
  payload: AdminSetPasswordRequest,
): Promise<AdminUserDetail> {
  return apiPost<AdminUserDetail>(`/api/v1/admin/users/${userId}/password`, payload);
}

export function listCustomers(
  params: PaginationParams = {},
): Promise<PaginatedResponse<AdminCustomerListItem>> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const query = q.toString();
  return apiGet<PaginatedResponse<AdminCustomerListItem>>(
    `/api/v1/admin/customers${query ? `?${query}` : ""}`,
  );
}

export function getCustomer(customerId: number): Promise<AdminCustomerDetail> {
  return apiGet<AdminCustomerDetail>(`/api/v1/admin/customers/${customerId}`);
}

export function updateCustomer(
  customerId: number,
  payload: AdminCustomerUpdate,
): Promise<AdminCustomerDetail> {
  return apiPatch<AdminCustomerDetail>(`/api/v1/admin/customers/${customerId}`, payload);
}

export function setCustomerPassword(
  customerId: number,
  payload: AdminSetPasswordRequest,
): Promise<AdminCustomerDetail> {
  return apiPost<AdminCustomerDetail>(`/api/v1/admin/customers/${customerId}/password`, payload);
}
