import { apiGet } from "@/lib/api/client";
import type { PublicHomepageResponse } from "@/types/public/store";

export function getHomepage(query?: string): Promise<PublicHomepageResponse> {
  const search = new URLSearchParams();
  if (query && query.trim()) {
    search.set("query", query.trim());
  }
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiGet<PublicHomepageResponse>(`/api/v1/public/home${suffix}`, { auth: false });
}
