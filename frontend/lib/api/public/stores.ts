import { apiGet, apiPost } from "@/lib/api/client";
import type {
  CheckoutResponse,
  DiscountPreviewRequest,
  DiscountPreviewResponse,
  GuestOrderCreate,
} from "@/types/public/checkout";
import type {
  ProductSortKey,
  PublicProductDetailResponse,
  PublicProductListResponse,
  PublicStorePageResponse,
} from "@/types/public/store";

export function getStoreBySlug(slug: string): Promise<PublicStorePageResponse> {
  return apiGet<PublicStorePageResponse>(`/api/v1/public/stores/${slug}`, { auth: false });
}

export function getProductBySlug(slug: string, productId: number): Promise<PublicProductDetailResponse> {
  return apiGet<PublicProductDetailResponse>(
    `/api/v1/public/stores/${slug}/products/${productId}`,
    { auth: false },
  );
}

export type ProductSearchQuery = {
  q?: string;
  min_price?: string;
  max_price?: string;
  in_stock?: boolean;
  category?: string;
  sort?: ProductSortKey;
  page?: number;
  page_size?: number;
};

export function searchStoreProducts(
  slug: string,
  query: ProductSearchQuery = {},
): Promise<PublicProductListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.min_price) params.set("min_price", query.min_price);
  if (query.max_price) params.set("max_price", query.max_price);
  if (query.in_stock) params.set("in_stock", "true");
  if (query.category) params.set("category", query.category);
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const suffix = params.toString();
  return apiGet<PublicProductListResponse>(
    `/api/v1/public/stores/${slug}/products` + (suffix ? "?" + suffix : ""),
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

export function previewDiscount(
  slug: string,
  body: DiscountPreviewRequest,
): Promise<DiscountPreviewResponse> {
  return apiPost<DiscountPreviewResponse>(
    `/api/v1/public/stores/${slug}/discount-preview`,
    body,
    { auth: false },
  );
}
