import { apiPost } from "@/lib/api/client";

export type VerifyEmailKind = "customer" | "seller";

export function verifyEmail(token: string, kind: VerifyEmailKind): Promise<{ verified: boolean }> {
  return apiPost<{ verified: boolean }>("/api/v1/public/verify-email", { token, kind }, {
    auth: false,
  });
}

export function resendVerificationEmail(
  email: string,
  kind: VerifyEmailKind,
): Promise<{ sent: boolean }> {
  return apiPost<{ sent: boolean }>(
    "/api/v1/public/verify-email/resend",
    { email, kind },
    { auth: false },
  );
}
