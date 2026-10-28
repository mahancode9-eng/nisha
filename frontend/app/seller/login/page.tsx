"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import * as onboardingApi from "@/lib/api/seller/onboarding";
import { paths } from "@/lib/auth/paths";
import { safeSellerNext } from "@/lib/auth/safe-next";
import type { User } from "@/types/auth";

export default function SellerLoginPage() {
  return (
    <Suspense>
      <SellerLoginContent />
    </Suspense>
  );
}

function SellerLoginContent() {
  const { login, loginWithGoogle, logout } = useAuth();
  const router = useRouter();
  const next = safeSellerNext(useSearchParams().get("next"));
  const registerHref = next ? `${paths.seller.register}?next=${encodeURIComponent(next)}` : paths.seller.register;

  async function finishSellerLogin(user: User) {
    if (user.role !== "SELLER") {
      logout();
      throw new ApiError(
        403,
        "این صفحه ورود فروشنده‌هاست. مدیرها از صفحه ورود مدیر وارد شن.",
      );
    }

    if (next) {
      router.replace(next);
      return;
    }

    try {
      const onboarding = await onboardingApi.getOnboarding();
      const status = onboarding.state.status;
      if (status !== "COMPLETED" && status !== "SKIPPED") {
        router.replace(paths.seller.onboarding);
        return;
      }
    } catch {
      // Fall through to dashboard if onboarding state is unavailable.
    }

    router.replace(paths.seller.dashboard);
  }

  async function handleLogin(email: string, password: string) {
    const user = await login({ email, password });
    await finishSellerLogin(user);
  }

  async function handleGoogle(idToken: string) {
    const user = await loginWithGoogle(idToken);
    await finishSellerLogin(user);
  }

  return (
    <GuestOnly role="SELLER" redirectTo={next}>
      <AuthPageFrame>
        <LoginForm
          title="ورود فروشنده"
          subtitle="برای مدیریت فروشگاهت وارد شو"
          onSubmit={handleLogin}
          onGoogleCredential={handleGoogle}
          forgotPasswordHref={paths.seller.recover}
          footer={
            <>
              حساب نداری؟{" "}
              <Link href={registerHref} className="font-medium text-brand-deep hover:underline">
                ثبت‌نام
              </Link>
            </>
          }
        />
      </AuthPageFrame>
    </GuestOnly>
  );
}
