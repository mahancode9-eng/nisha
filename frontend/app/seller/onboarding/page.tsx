"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { SellerOnboardingExperience } from "@/components/seller/SellerOnboardingExperience";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import * as onboardingApi from "@/lib/api/seller/onboarding";
import { paths } from "@/lib/auth/paths";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, error, isLoading } = useSellerFetch(
    () => onboardingApi.getOnboarding(),
    [user?.id],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "SELLER") {
      router.replace(paths.seller.login);
    }
  }, [authLoading, user, router]);

  if (authLoading || (!user && !error)) {
    return <LoadingState message="چند لحظه صبر کن، داریم فروشگاهت را آماده می‌کنیم…" />;
  }

  if (!user || user.role !== "SELLER") {
    return <LoadingState message="در حال انتقال به ورود فروشنده…" />;
  }

  if (isLoading) {
    return <LoadingState message="چند لحظه صبر کن، داریم فروشگاهت را آماده می‌کنیم…" />;
  }

  if (error || !data) {
    return <ErrorAlert message={error ?? "بارگذاری مراحل شروع ممکن نشد"} />;
  }

  return <SellerOnboardingExperience data={data} />;
}
