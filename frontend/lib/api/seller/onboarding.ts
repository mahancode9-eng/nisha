import { apiGet, apiPatch } from "@/lib/api/client";
import type { SellerOnboardingResponse, SellerOnboardingUpdate } from "@/types/seller/onboarding";

export function getOnboarding(): Promise<SellerOnboardingResponse> {
  return apiGet<SellerOnboardingResponse>("/api/v1/seller/onboarding");
}

export function updateOnboarding(body: SellerOnboardingUpdate): Promise<SellerOnboardingResponse> {
  return apiPatch<SellerOnboardingResponse>("/api/v1/seller/onboarding", body);
}

