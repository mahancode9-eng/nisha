import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type {
  Store,
  StoreSocialLinkInput,
  StoreSocialLink,
  StoreUpdate,
} from "@/types/seller/store";

export function getStore(): Promise<Store> {
  return apiGet<Store>("/api/v1/seller/store");
}

export function updateStore(body: StoreUpdate): Promise<Store> {
  return apiPut<Store>("/api/v1/seller/store", body);
}

export function listStoreSocialLinks(): Promise<StoreSocialLink[]> {
  return apiGet<StoreSocialLink[]>("/api/v1/seller/store/social-links");
}

export function createStoreSocialLink(body: StoreSocialLinkInput): Promise<StoreSocialLink> {
  return apiPost<StoreSocialLink>("/api/v1/seller/store/social-links", body);
}

export function updateStoreSocialLink(
  id: number,
  body: StoreSocialLinkInput,
): Promise<StoreSocialLink> {
  return apiPut<StoreSocialLink>(`/api/v1/seller/store/social-links/${id}`, body);
}

export function deleteStoreSocialLink(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/store/social-links/${id}`);
}

export function reorderStoreSocialLinks(orderedIds: number[]): Promise<StoreSocialLink[]> {
  return apiPatch<StoreSocialLink[]>("/api/v1/seller/store/social-links/reorder", {
    ordered_ids: orderedIds,
  });
}
