import { apiGet, apiPatch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api/pagination";
import type { AdminComplaint, ComplaintStatus } from "@/types/admin/complaint";

export type ComplaintListParams = {
  page?: number;
  page_size?: number;
  status?: ComplaintStatus;
};

export function listComplaints(
  params: ComplaintListParams = {},
): Promise<PaginatedResponse<AdminComplaint>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  const suffix = qs ? "?" + qs : "";
  return apiGet<PaginatedResponse<AdminComplaint>>("/api/v1/admin/complaints" + suffix);
}

export function updateComplaint(
  id: number,
  payload: { status: ComplaintStatus; note?: string },
): Promise<AdminComplaint> {
  return apiPatch<AdminComplaint>(`/api/v1/admin/complaints/${id}`, payload);
}
