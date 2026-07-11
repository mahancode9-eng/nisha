"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/errors";
import { requestUserRecovery, verifyUserRecovery } from "@/lib/api/auth/recovery";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

type UserRecoverFormProps = {
  title: string;
  loginHref: string;
  afterVerifyHref: string;
};

export function UserRecoverForm({ title, loginHref, afterVerifyHref }: UserRecoverFormProps) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
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
      const res = await requestUserRecovery(email);
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
      const res = await verifyUserRecovery({
        recovery_id: recoveryId,
        code,
        new_password: newPassword,
      });
      if (!res.access_token || !res.user) {
        throw new Error("بازیابی کامل نشد");
      }
      setSession(res.access_token, res.user);
      router.replace(afterVerifyHref);
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
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            کد بازیابی به ایمیل شما ارسال می‌شود.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 py-6">
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="ایمیل"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
                  <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                    راهنمای تحویل: {hint}
                  </p>
                )}
                {debugCode && process.env.NODE_ENV !== "production" && (
                  <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                    کد توسعه: {debugCode}
                  </p>
                )}
              </form>
            )}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
                {error}
              </p>
            )}
            <p className="text-center text-sm text-foreground-muted">
              <Link href={loginHref} className="font-medium text-brand-deep hover:underline">
                بازگشت به ورود
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
