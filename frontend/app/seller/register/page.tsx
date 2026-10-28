"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { EmailVerificationPending } from "@/components/auth/EmailVerificationPending";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";
import { safeSellerNext } from "@/lib/auth/safe-next";

export default function SellerRegisterPage() {
  return (
    <Suspense>
      <SellerRegisterContent />
    </Suspense>
  );
}

function SellerRegisterContent() {
  const { register, loginWithGoogle, logout } = useAuth();
  const next = safeSellerNext(useSearchParams().get("next"));
  const afterSignUp = next ?? paths.seller.onboarding;
  const loginHref = next ? `${paths.seller.login}?next=${encodeURIComponent(next)}` : paths.seller.login;
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function handleRegister(data: {
    email: string;
    password: string;
    full_name: string;
  }) {
    const result = await register(data);
    if (result.status === "verification_required") {
      setPendingEmail(result.email);
      return;
    }
    window.location.href = afterSignUp;
  }

  async function handleGoogle(idToken: string) {
    const user = await loginWithGoogle(idToken);
    if (user.role !== "SELLER") {
      logout();
      throw new ApiError(
        403,
        "این صفحه ثبت‌نام فروشنده‌هاست. از صفحه مربوط به نقش خودت استفاده کن.",
      );
    }
    window.location.href = afterSignUp;
  }

  if (pendingEmail) {
    return (
      <GuestOnly role="SELLER" redirectTo={next}>
        <AuthPageFrame>
          <EmailVerificationPending
            email={pendingEmail}
            kind="seller"
            loginHref={loginHref}
          />
        </AuthPageFrame>
      </GuestOnly>
    );
  }

  return (
    <GuestOnly role="SELLER" redirectTo={next}>
      <AuthPageFrame>
        <RegisterForm
          onSubmit={handleRegister}
          onGoogleCredential={handleGoogle}
          loginHref={loginHref}
          footer={
            <>
              حساب داری؟{" "}
              <Link href={loginHref} className="font-medium text-brand hover:underline">
                وارد شو
              </Link>
            </>
          }
        />
      </AuthPageFrame>
    </GuestOnly>
  );
}
