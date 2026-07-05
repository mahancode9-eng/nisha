"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    const user = await login({ email, password });
    if (user.role !== "ADMIN") {
      throw new ApiError(
        403,
        "فقط برای مدیران است. برای حساب فروشنده از ورود فروشنده استفاده کنید.",
      );
    }
    router.replace(paths.admin.dashboard);
  }

  return (
    <GuestOnly role="ADMIN">
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="absolute right-4 top-4 z-10">
          <ThemeSwitcher variant="button" />
        </div>
        <LoginForm
          title="ورود مدیر"
          subtitle="مدیریت و نظارت بر پلتفرم"
          onSubmit={handleLogin}
          footer={
            <Link href={paths.home} className="text-brand-deep hover:underline">
              بازگشت به صفحه اصلی
            </Link>
          }
        />
      </div>
    </GuestOnly>
  );
}
