"use client";

import { useState, type FormEvent } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type LoginFormProps = {
  title: string;
  subtitle?: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  onGoogleCredential?: (idToken: string) => Promise<void>;
  footer?: React.ReactNode;
  forgotPasswordHref?: string;
};

export function LoginForm({
  title,
  subtitle,
  onSubmit,
  onGoogleCredential,
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
      setError(err instanceof ApiError ? err.message : "ورود نشد. ایمیل یا رمز رو چک کن.");
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <ErrorAlert message={error ?? ""} />
          {onGoogleCredential ? (
            <GoogleSignInButton
              disabled={loading}
              onCredential={async (idToken) => {
                setError(null);
                setLoading(true);
                try {
                  await onGoogleCredential(idToken);
                } catch (err) {
                  setError(
                    err instanceof ApiError
                      ? err.message
                      : "ورود با گوگل نشد. دوباره امتحان کن.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : null}
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
                رمزت رو فراموش کردی؟
              </a>
            </p>
          )}
        </form>
        {footer && <div className="mt-6 text-center text-sm text-foreground-muted">{footer}</div>}
      </CardContent>
    </Card>
  );
}
