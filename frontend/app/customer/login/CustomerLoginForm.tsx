"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";
import { resendVerificationEmail } from "@/lib/api/verify-email";

export default function CustomerLoginForm() {
  const { login, loginWithGoogle, customer, isLoading } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirect =
    rawRedirect &&
    rawRedirect.startsWith("/") &&
    !rawRedirect.startsWith("//")
      ? rawRedirect
      : paths.customer.dashboard;
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string | null>(null);
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
      if (err instanceof ApiError && err.status === 403 && loginId.includes("@")) {
        setResendEmail(loginId);
      }
      setError(err instanceof ApiError ? err.message : "ورود نشد. ایمیل یا رمز رو چک کن.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageFrame>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>ورود مشتری</CardTitle>
          <p className="mt-1 text-sm text-foreground-muted">
            برای دیدن سفارش‌ها و پیام به فروشنده‌ها، وارد شو
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
                {error}
              </p>
            )}
            {resendEmail && (
              <button
                type="button"
                className="w-full text-sm font-medium text-brand-deep hover:underline"
                onClick={async () => {
                  try {
                    await resendVerificationEmail(resendEmail, "customer");
                    setError("ایمیل تایید دوباره فرستاده شد.");
                  } catch {
                    setError("ایمیل دوباره فرستاده نشد. کمی بعد امتحان کن.");
                  }
                }}
              >
                دوباره ایمیل تایید بفرست
              </button>
            )}
            <Button type="submit" className="w-full" loading={submitting}>
              ورود
            </Button>
            <GoogleSignInButton
              disabled={submitting}
              onCredential={async (idToken) => {
                setError(null);
                setSubmitting(true);
                try {
                  await loginWithGoogle(idToken);
                } catch (err) {
                  setError(
                    err instanceof ApiError
                      ? err.message
                      : "ورود با گوگل نشد. دوباره امتحان کن.",
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
            />
            <p className="text-center text-sm text-foreground-muted">
              حساب نداری؟{" "}
              <Link href={paths.customer.register} className="font-medium text-brand-deep hover:underline">
                ثبت‌نام
              </Link>
            </p>
            <p className="text-center text-sm">
              <Link href={paths.customer.recover} className="font-medium text-brand-deep hover:underline">
                رمزت رو فراموش کردی؟
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthPageFrame>
  );
}
