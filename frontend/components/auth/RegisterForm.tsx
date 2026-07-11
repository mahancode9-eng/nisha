"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type RegisterFormProps = {
  onSubmit: (data: {
    email: string;
    password: string;
    full_name: string;
  }) => Promise<void>;
  footer?: React.ReactNode;
  loginHref?: string;
};

export function RegisterForm({ onSubmit, footer, loginHref }: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setShowLoginHint(false);
    setLoading(true);
    try {
      await onSubmit({ email, password, full_name: fullName });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setShowLoginHint(true);
      }
      setError(err instanceof ApiError ? err.message : "ثبت‌نام ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>ایجاد حساب فروشنده</CardTitle>
        <p className="mt-1 text-sm text-foreground-muted">
          فروش را با فروشگاه آنلاین اختصاصی خود شروع کنید.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error ?? ""} />
          {showLoginHint && loginHref && (
            <p className="text-center text-sm text-foreground-muted">
              این ایمیل قبلاً تأیید شده است.{" "}
              <Link href={loginHref} className="font-medium text-brand hover:underline">
                وارد شوید
              </Link>
            </p>
          )}
          <Input
            label="نام کامل"
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="ایمیل"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="رمز عبور"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            hint="حداقل ۸ کاراکتر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={loading}>
            ایجاد حساب
          </Button>
        </form>
        {footer && <div className="mt-6 text-center text-sm text-foreground-muted">{footer}</div>}
      </CardContent>
    </Card>
  );
}
