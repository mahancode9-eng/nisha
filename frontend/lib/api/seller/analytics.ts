import { apiGet } from "@/lib/api/client";
import type { SellerAnalyticsResponse } from "@/types/seller/analytics";

export function getAnalytics(days = 30): Promise<SellerAnalyticsResponse> {
  return apiGet<SellerAnalyticsResponse>(`/api/v1/seller/analytics?days=${days}`);
}
