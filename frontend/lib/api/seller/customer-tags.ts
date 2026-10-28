import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  CustomerTag,
  CustomerTagCreate,
  CustomerTagUpdate,
} from "@/types/seller/customer-tag";

export function listCustomerTags(): Promise<CustomerTag[]> {
  return apiGet<CustomerTag[]>("/api/v1/seller/customer-tags");
}

export function createCustomerTag(body: CustomerTagCreate): Promise<CustomerTag> {
  return apiPost<CustomerTag>("/api/v1/seller/customer-tags", body);
}

export function updateCustomerTag(id: number, body: CustomerTagUpdate): Promise<CustomerTag> {
  return apiPut<CustomerTag>(`/api/v1/seller/customer-tags/${id}`, body);
}

export function deleteCustomerTag(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/customer-tags/${id}`);
}

export function assignCustomerTags(
  customerKey: string,
  tagIds: number[],
): Promise<CustomerTag[]> {
  return apiPut<CustomerTag[]>(
    `/api/v1/seller/customer-tags/customers/${encodeURIComponent(customerKey)}`,
    { tag_ids: tagIds },
  );
}
