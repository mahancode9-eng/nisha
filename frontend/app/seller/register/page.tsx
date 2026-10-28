"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { EmailVerificationPending } from "@/components/auth/EmailVerificationPending";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";

export default function SellerRegisterPage() {
  const { register, loginWithGoogle, logout } = useAuth();
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
    window.location.href = paths.seller.onboarding;
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
    window.location.href = paths.seller.onboarding;
  }

  if (pendingEmail) {
    return (
      <GuestOnly role="SELLER">
        <AuthPageFrame>
          <EmailVerificationPending
            email={pendingEmail}
            kind="seller"
            loginHref={paths.seller.login}
          />
        </AuthPageFrame>
      </GuestOnly>
    );
  }

  return (
    <GuestOnly role="SELLER">
      <AuthPageFrame>
        <RegisterForm
          onSubmit={handleRegister}
          onGoogleCredential={handleGoogle}
          loginHref={paths.seller.login}
          footer={
            <>
              حساب داری؟{" "}
              <Link href={paths.seller.login} className="font-medium text-brand hover:underline">
                وارد شو
              </Link>
            </>
          }
        />
      </AuthPageFrame>
    </GuestOnly>
  );
}
