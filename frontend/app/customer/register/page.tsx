"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthPageFrame } from "@/components/auth/AuthPageFrame";
import { EmailVerificationPending } from "@/components/auth/EmailVerificationPending";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

export default function CustomerRegisterPage() {
  const { register, loginWithGoogle } = useCustomerAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showLoginHint, setShowLoginHint] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setShowLoginHint(false);
    try {
      const result = await register({
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        postal_code: postalCode || undefined,
        password,
      });
      if (result.status === "verification_required") {
        setPendingEmail(result.email);
        return;
      }
      router.replace(paths.customer.dashboard);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setShowLoginHint(true);
      }
      setError(err instanceof ApiError ? err.message : "ثبت‌نام نشد. دوباره امتحان کن.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingEmail) {
    return (
      <AuthPageFrame>
        <EmailVerificationPending
          email={pendingEmail}
          kind="customer"
          loginHref={paths.customer.login}
        />
      </AuthPageFrame>
    );
  }

  return (
    <AuthPageFrame>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>حساب مشتری بساز</CardTitle>
          <p className="mt-1 text-sm text-foreground-muted">
            اختیاریه؛ بدون حساب هم می‌تونی خرید کنی
          </p>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="نام کامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input
            label="ایمیل"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ایمیل یا تلفن؛ یکی کافیه"
          />
          <Input
            label="تلفن"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ایمیل یا تلفن؛ یکی کافیه"
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
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
          {showLoginHint && (
            <p className="text-center text-sm text-foreground-muted">
              این ایمیل قبلاً تایید شده.{" "}
              <Link href={paths.customer.login} className="font-medium text-brand-deep hover:underline">
                وارد شو
              </Link>
            </p>
          )}
          <Button type="submit" className="w-full" loading={submitting}>
            ثبت‌نام
          </Button>
          <GoogleSignInButton
            disabled={submitting}
            onCredential={async (idToken) => {
              setError(null);
              setShowLoginHint(false);
              setSubmitting(true);
              try {
                await loginWithGoogle(idToken);
                router.replace(paths.customer.dashboard);
              } catch (err) {
                if (err instanceof ApiError && err.status === 409) {
                  setShowLoginHint(true);
                }
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
        </form>
        <p className="mt-4 text-center text-sm text-foreground-muted">
          حساب داری؟{" "}
          <Link href={paths.customer.login} className="font-medium text-brand-deep hover:underline">
            ورود
          </Link>
        </p>
        </CardContent>
      </Card>
    </AuthPageFrame>
  );
}
