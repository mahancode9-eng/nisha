import { apiGet } from "@/lib/api/client";
import type { SalesReport } from "@/types/seller/sales-report";

export function getSalesReport(days = 30): Promise<SalesReport> {
  return apiGet<SalesReport>(`/api/v1/seller/reports/sales?days=${days}`);
}
