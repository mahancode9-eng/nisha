import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api/pagination";
import type {
  MyStore,
  StoreRole,
  TeamAuditEntry,
  TeamInvite,
  TeamMember,
  TeamOverview,
} from "@/types/seller/team";

export function getTeam(): Promise<TeamOverview> {
  return apiGet<TeamOverview>("/api/v1/seller/team");
}

export function inviteMember(email: string, role: StoreRole): Promise<TeamInvite> {
  return apiPost<TeamInvite>("/api/v1/seller/team/invites", { email, role });
}

export function changeMemberRole(id: number, role: StoreRole): Promise<TeamMember> {
  return apiPatch<TeamMember>(`/api/v1/seller/team/members/${id}`, { role });
}

export function removeMember(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/seller/team/members/${id}`);
}

export function listAudit(page = 1): Promise<PaginatedResponse<TeamAuditEntry>> {
  return apiGet<PaginatedResponse<TeamAuditEntry>>(`/api/v1/seller/team/audit?page=${page}`);
}

export function acceptInvite(token: string): Promise<MyStore> {
  return apiPost<MyStore>("/api/v1/seller/team/accept", { token });
}

export function listMyStores(): Promise<MyStore[]> {
  return apiGet<MyStore[]>("/api/v1/seller/team/my-stores");
}
