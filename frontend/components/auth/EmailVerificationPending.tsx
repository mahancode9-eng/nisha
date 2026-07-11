"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { resendVerificationEmail, type VerifyEmailKind } from "@/lib/api/verify-email";
import { ApiError } from "@/lib/api/errors";

type EmailVerificationPendingProps = {
  email: string;
  kind: VerifyEmailKind;
  loginHref: string;
};

export function EmailVerificationPending({
  email,
  kind,
  loginHref,
}: EmailVerificationPendingProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await resendVerificationEmail(email, kind);
      setMessage("ایمیل تأیید دوباره ارسال شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ارسال مجدد ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">ایمیل خود را تأیید کنید</h1>
      <p className="mt-3 text-sm text-foreground-muted">
        لینک تأیید به <span className="font-medium text-foreground">{email}</span> ارسال شد. پس از
        تأیید می‌توانید وارد شوید.
      </p>
      <div className="mt-6 space-y-3">
        <Button type="button" className="w-full" loading={loading} onClick={handleResend}>
          ارسال مجدد ایمیل تأیید
        </Button>
        <Link
          href={loginHref}
          className="block text-sm font-medium text-brand-deep hover:underline"
        >
          بازگشت به ورود
        </Link>
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
