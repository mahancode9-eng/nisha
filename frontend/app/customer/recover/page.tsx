"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/errors";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { paths } from "@/lib/auth/paths";
import { requestRecovery, verifyRecovery } from "@/lib/api/customer/recovery";
import type { RecoveryChannel } from "@/types/customer/recovery";

export default function CustomerRecoverPage() {
  const router = useRouter();
  const { setSession } = useCustomerAuth();
  const [login, setLogin] = useState("");
  const [channel, setChannel] = useState<RecoveryChannel>("EMAIL");
  const [recoveryId, setRecoveryId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await requestRecovery({ login, channel });
      setRecoveryId(res.recovery_id);
      setHint(res.delivery_hint);
      setDebugCode(res.debug_code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "شروع بازیابی ممکن نشد");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!recoveryId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyRecovery({
        recovery_id: recoveryId,
        code,
        new_password: newPassword,
      });
      setSession(res.access_token, res.customer);
      router.replace(paths.customer.dashboard);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بازیابی ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSwitcher variant="button" />
      </div>
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">بازیابی رمز عبور</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            کد را با ایمیل یا پیامک دریافت کنید و سپس رمز جدید تعیین کنید.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 py-6">
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="ایمیل یا تلفن"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">روش ارسال</span>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as RecoveryChannel)}
                >
                  <option value="EMAIL">ایمیل</option>
                  <option value="SMS">پیامک</option>
                </select>
              </label>
              <Button type="submit" loading={loading} className="w-full">
                ارسال کد بازیابی
              </Button>
            </form>

            {recoveryId && (
              <form onSubmit={handleVerify} className="space-y-4 border-t border-border pt-4">
                <Input label="کد بازیابی" value={code} onChange={(e) => setCode(e.target.value)} required />
                <Input
                  label="رمز عبور جدید"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Button type="submit" loading={loading} className="w-full">
                  تنظیم رمز جدید
                </Button>
                {hint && (
                  <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                    <p>راهنمای تحویل: {hint}</p>
                  </div>
                )}
                {debugCode && process.env.NODE_ENV !== "production" && (
                  <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                    <p>کد توسعه: {debugCode}</p>
                  </div>
                )}
              </form>
            )}

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
