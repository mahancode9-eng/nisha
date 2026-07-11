"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type LoginFormProps = {
  title: string;
  subtitle?: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footer?: React.ReactNode;
  forgotPasswordHref?: string;
};

export function LoginForm({
  title,
  subtitle,
  onSubmit,
  footer,
  forgotPasswordHref,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ورود ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error ?? ""} />
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={loading}>
            ورود
          </Button>
          {forgotPasswordHref && (
            <p className="text-center text-sm">
              <a href={forgotPasswordHref} className="font-medium text-brand-deep hover:underline">
                رمز عبور را فراموش کرده‌اید؟
              </a>
            </p>
          )}
        </form>
        {footer && <div className="mt-6 text-center text-sm text-foreground-muted">{footer}</div>}
      </CardContent>
    </Card>
  );
}
