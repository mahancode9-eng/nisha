import { apiPost } from "@/lib/api/client";
import type { TokenResponse } from "@/types/auth";

export type UserRecoveryStartResponse = {
  recovery_id: number;
  expires_at: string;
  delivery_hint: string | null;
  debug_code: string | null;
};

export function requestUserRecovery(email: string): Promise<UserRecoveryStartResponse> {
  return apiPost<UserRecoveryStartResponse>(
    "/api/v1/auth/password-recovery/request",
    { email },
    { auth: false },
  );
}

export function verifyUserRecovery(body: {
  recovery_id: number;
  code: string;
  new_password: string;
}): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/v1/auth/password-recovery/verify", body, {
    auth: false,
  });
}
