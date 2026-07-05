"use client";

import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { SellerOnboardingExperience } from "@/components/seller/SellerOnboardingExperience";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import * as onboardingApi from "@/lib/api/seller/onboarding";

export default function SellerOnboardingPage() {
  const { data, error, isLoading } = useSellerFetch(() => onboardingApi.getOnboarding(), []);

  if (isLoading) {
    return <LoadingState message="در حال آماده‌سازی تجربه راه‌اندازی فروشگاه..." />;
  }

  if (error || !data) {
    return <ErrorAlert message={error ?? "بارگذاری مراحل شروع ممکن نشد"} />;
  }

  return <SellerOnboardingExperience data={data} />;
}
