import { apiGet } from "@/lib/api/client";
import type { SalesReport } from "@/types/seller/report";

export function getSalesReport(month?: string): Promise<SalesReport> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiGet<SalesReport>(`/api/v1/seller/reports/sales${query}`);
}
