"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

export default function CustomerRegisterPage() {
  const { register } = useCustomerAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        postal_code: postalCode || undefined,
        password,
      });
      router.replace(paths.customer.dashboard);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت‌نام ناموفق بود");
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
        <h1 className="text-2xl font-bold text-foreground">ایجاد حساب مشتری</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          اختیاری است - پرداخت مهمان همچنان بدون حساب کار می‌کند
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="نام کامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input
            label="ایمیل"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="اگر تلفن وارد شده باشد اختیاری است"
          />
          <Input
            label="تلفن"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="اگر ایمیل وارد شده باشد اختیاری است"
          />
          <Input
            label="کد پستی"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="اختیاری"
          />
          <Input
            label="رمز عبور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={submitting}>
            ثبت‌نام
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          حساب دارید؟{" "}
          <Link href={paths.customer.login} className="font-medium text-brand-deep hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  );
}
