import { apiGet } from "@/lib/api/client";
import type { AdminDashboard } from "@/types/admin/dashboard";

export function getDashboard(): Promise<AdminDashboard> {
  return apiGet<AdminDashboard>("/api/v1/admin/dashboard");
}
