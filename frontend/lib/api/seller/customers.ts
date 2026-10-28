import { apiGet, apiRequest } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api/pagination";
import type {
  ListSellerCustomersParams,
  SellerCustomerDetail,
  SellerCustomerListItem,
} from "@/types/seller/customer";

function buildQuery(params: ListSellerCustomersParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.repeat_only) q.set("repeat_only", "true");
  if (params.tag) q.set("tag", params.tag);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function listCustomers(
  params: ListSellerCustomersParams = {},
): Promise<PaginatedResponse<SellerCustomerListItem>> {
  return apiGet<PaginatedResponse<SellerCustomerListItem>>(
    `/api/v1/seller/customers${buildQuery(params)}`,
  );
}

export function getCustomer(key: string): Promise<SellerCustomerDetail> {
  return apiGet<SellerCustomerDetail>(
    `/api/v1/seller/customers/${encodeURIComponent(key)}`,
  );
}

export function listCustomerTags(): Promise<string[]> {
  return apiGet<string[]>("/api/v1/seller/customers/tags");
}

export function setCustomerTags(key: string, tags: string[]): Promise<{ key: string; tags: string[] }> {
  return apiRequest<{ key: string; tags: string[] }>(
    `/api/v1/seller/customers/${encodeURIComponent(key)}/tags`,
    { method: "PUT", json: { tags } },
  );
}
