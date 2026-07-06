import { apiPost } from "@/lib/api/client";
import type { User } from "@/types/auth";

export type ImpersonationResponse = {
  access_token: string;
  refresh_token: string;
  user: User;
};

export function impersonateStore(storeId: number): Promise<ImpersonationResponse> {
  return apiPost<ImpersonationResponse>(`/api/v1/admin/stores/${storeId}/impersonate`);
}
