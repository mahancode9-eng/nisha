import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { SellerDomain } from "@/types/seller/domain";

export function getDomain(): Promise<SellerDomain> {
  return apiGet<SellerDomain>("/api/v1/seller/domain");
}

export function connectDomain(hostname: string): Promise<SellerDomain> {
  return apiPut<SellerDomain>("/api/v1/seller/domain", { hostname });
}

export function verifyDomain(): Promise<SellerDomain> {
  return apiPost<SellerDomain>("/api/v1/seller/domain/verify");
}

export function disconnectDomain(): Promise<void> {
  return apiDelete<void>("/api/v1/seller/domain");
}
