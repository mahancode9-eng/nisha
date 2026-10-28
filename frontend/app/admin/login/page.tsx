"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    const user = await login({ email, password });
    if (user.role !== "ADMIN") {
      logout();
      throw new ApiError(
        403,
        "فقط برای مدیرهاست. برای حساب فروشنده از ورود فروشنده استفاده کن.",
      );
    }
    router.replace(paths.admin.dashboard);
  }

  return (
    <GuestOnly role="ADMIN">
      <AuthPageFrame>
        <LoginForm
          title="ورود مدیر"
          subtitle="مدیریت و نظارت روی نیشا"
          onSubmit={handleLogin}
          forgotPasswordHref={paths.admin.recover}
          footer={
            <Link href={paths.home} className="text-brand-deep hover:underline">
              برگرد صفحه اصلی
            </Link>
          }
        />
      </AuthPageFrame>
    </GuestOnly>
  );
}
