"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export default function CustomerLoginForm() {
  const { login, customer, isLoading } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirect = rawRedirect && rawRedirect.startsWith("/")
    ? rawRedirect
    : paths.customer.dashboard;
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && customer) {
      router.replace(redirect);
    }
  }, [isLoading, customer, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ login: loginId, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ورود ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSwitcher variant="button" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">ورود مشتری</h1>
        <p className="mt-1 text-sm text-foreground-muted">برای ارسال پیام به فروشندگان و حفظ تاریخچه گفتگو وارد شوید</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="ایمیل یا تلفن"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />
          <Input
            label="رمز عبور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={submitting}>
            ورود
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          حساب ندارید؟{" "}
          <Link href={paths.customer.register} className="font-medium text-brand-deep hover:underline">
            ثبت‌نام
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-foreground-muted">
          <Link href={paths.customer.recover} className="font-medium text-brand-deep hover:underline">
            رمز عبور را فراموش کرده‌اید؟
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href={paths.home} className="text-foreground-muted hover:underline">
            بازگشت به صفحه اصلی
          </Link>
        </p>
      </div>
    </div>
  );
}
