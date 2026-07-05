import type { CustomerProfile } from "@/types/customer/profile";

export type RecoveryChannel = "EMAIL" | "SMS";

export type CustomerRecoveryRequest = {
  login: string;
  channel: RecoveryChannel;
};

export type CustomerRecoveryStartResponse = {
  recovery_id: number;
  channel: RecoveryChannel;
  expires_at: string;
  delivery_hint: string | null;
  debug_code: string | null;
};

export type CustomerRecoveryVerifyRequest = {
  recovery_id: number;
  code: string;
  new_password: string;
};

export type CustomerRecoveryVerifyResponse = {
  access_token: string;
  token_type: string;
  customer: CustomerProfile;
};
