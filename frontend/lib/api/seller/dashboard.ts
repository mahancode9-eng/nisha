import { apiGet } from "@/lib/api/client";
import type { SellerDashboardResponse } from "@/types/seller/dashboard";

export function getDashboard(): Promise<SellerDashboardResponse> {
  return apiGet<SellerDashboardResponse>("/api/v1/seller/dashboard");
}
