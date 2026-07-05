"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import * as onboardingApi from "@/lib/api/seller/onboarding";
import { paths } from "@/lib/auth/paths";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export default function SellerLoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    const user = await login({ email, password });
    if (user.role !== "SELLER") {
      throw new ApiError(
        403,
        "این ورود فقط برای فروشندگان است. برای مدیران از ورود مدیر استفاده کنید.",
      );
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

  return (
    <GuestOnly role="SELLER">
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="absolute right-4 top-4 z-10">
          <ThemeSwitcher variant="button" />
        </div>
        <LoginForm
          title="ورود فروشنده"
          subtitle="برای مدیریت فروشگاه وارد شوید"
          onSubmit={handleLogin}
          footer={
            <>
              حساب ندارید؟{" "}
              <Link href={paths.seller.register} className="font-medium text-brand-deep hover:underline">
                ثبت‌نام
              </Link>
            </>
          }
        />
      </div>
    </GuestOnly>
  );
}
