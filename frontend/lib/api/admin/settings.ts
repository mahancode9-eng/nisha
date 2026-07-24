import { apiGet, apiPatch } from "@/lib/api/client";
import type { AdminPlatformSettings, AdminPlatformSettingsUpdate } from "@/types/admin/settings";

export function getPlatformSettings(): Promise<AdminPlatformSettings> {
  return apiGet<AdminPlatformSettings>("/api/v1/admin/settings");
}

export function updatePlatformSettings(
  payload: AdminPlatformSettingsUpdate,
): Promise<AdminPlatformSettings> {
  return apiPatch<AdminPlatformSettings>("/api/v1/admin/settings", payload);
}
