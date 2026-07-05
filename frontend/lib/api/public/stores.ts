import { apiGet, apiPost } from "@/lib/api/client";
import type { CheckoutResponse, GuestOrderCreate } from "@/types/public/checkout";
import type { PublicProductDetailResponse, PublicStorePageResponse } from "@/types/public/store";

export function getStoreBySlug(slug: string): Promise<PublicStorePageResponse> {
  return apiGet<PublicStorePageResponse>(`/api/v1/public/stores/${slug}`, { auth: false });
}

export function getProductBySlug(slug: string, productId: number): Promise<PublicProductDetailResponse> {
  return apiGet<PublicProductDetailResponse>(
    `/api/v1/public/stores/${slug}/products/${productId}`,
    { auth: false },
  );
}

export function createGuestOrder(
  slug: string,
  body: GuestOrderCreate,
): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>(`/api/v1/public/stores/${slug}/orders`, body, {
    auth: false,
  });
}
