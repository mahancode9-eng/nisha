import { apiGet } from "@/lib/api/client";
import type { HealthResponse } from "@/types";

export { ApiError } from "@/lib/api/errors";
export {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "@/lib/api/client";
export * from "@/lib/api/auth";

export async function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/api/v1/health", { auth: false });
}
