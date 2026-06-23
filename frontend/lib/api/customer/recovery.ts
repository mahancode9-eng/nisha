import { customerApiPost } from "@/lib/api/customer-client";
import type {
  CustomerRecoveryRequest,
  CustomerRecoveryStartResponse,
  CustomerRecoveryVerifyRequest,
  CustomerRecoveryVerifyResponse,
} from "@/types/customer/recovery";

export function requestRecovery(
  body: CustomerRecoveryRequest,
): Promise<CustomerRecoveryStartResponse> {
  return customerApiPost<CustomerRecoveryStartResponse>(
    "/api/v1/customer/password-recovery/request",
    body,
    { auth: false },
  );
}

export function verifyRecovery(
  body: CustomerRecoveryVerifyRequest,
): Promise<CustomerRecoveryVerifyResponse> {
  return customerApiPost<CustomerRecoveryVerifyResponse>(
    "/api/v1/customer/password-recovery/verify",
    body,
    { auth: false },
  );
}
