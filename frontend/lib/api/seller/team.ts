import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Store } from "@/types/seller/store";
import type {
  StoreActionLog,
  StoreMember,
  StoreMemberCreate,
} from "@/types/seller/team";

export function listMembers(): Promise<StoreMember[]> {
  return apiGet<StoreMember[]>("/api/v1/seller/team/members");
}

export function inviteMember(body: StoreMemberCreate): Promise<StoreMember> {
  return apiPost<StoreMember>("/api/v1/seller/team/members", body);
}

export function removeMember(memberId: number): Promise<void> {
  return apiDelete(`/api/v1/seller/team/members/${memberId}`);
}

export function listAuditLogs(limit = 50): Promise<StoreActionLog[]> {
  return apiGet<StoreActionLog[]>(`/api/v1/seller/team/audit-logs?limit=${limit}`);
}

export function setCustomDomain(customDomain: string | null): Promise<Store> {
  return apiPut<Store>("/api/v1/seller/team/domain", { custom_domain: customDomain });
}

export function verifyCustomDomain(): Promise<Store> {
  return apiPost<Store>("/api/v1/seller/team/domain/verify");
}
