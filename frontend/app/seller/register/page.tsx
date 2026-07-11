"use client";

import Link from "next/link";
import { useState } from "react";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { EmailVerificationPending } from "@/components/auth/EmailVerificationPending";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";

export default function SellerRegisterPage() {
  const { register } = useAuth();
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

  if (pendingEmail) {
    return (
      <GuestOnly role="SELLER">
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <EmailVerificationPending
            email={pendingEmail}
            kind="seller"
            loginHref={paths.seller.login}
          />
        </div>
      </GuestOnly>
    );
  }

  return (
    <GuestOnly role="SELLER">
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <RegisterForm
          onSubmit={handleRegister}
          loginHref={paths.seller.login}
          footer={
            <>
              حساب کاربری دارید؟{" "}
              <Link href={paths.seller.login} className="font-medium text-brand hover:underline">
                وارد شوید
              </Link>
            </>
          }
        />
      </div>
    </GuestOnly>
  );
}
