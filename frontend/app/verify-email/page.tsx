"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { verifyEmail, type VerifyEmailKind } from "@/lib/api/verify-email";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const kind = (searchParams.get("kind") ?? "customer") as VerifyEmailKind;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("لینک تأیید نامعتبر است.");
      return;
    }
    verifyEmail(token, kind)
      .then(() => {
        setStatus("success");
        setMessage("ایمیل شما با موفقیت تأیید شد.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "تأیید ایمیل ناموفق بود");
      });
  }, [token, kind]);

  const loginHref = kind === "seller" ? paths.seller.login : paths.customer.login;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSwitcher variant="button" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        {status === "loading" && <p className="text-foreground-muted">در حال تأیید ایمیل...</p>}
        {status !== "loading" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              {status === "success" ? "تأیید شد" : "خطا"}
            </h1>
            <p className="mt-3 text-sm text-foreground-muted">{message}</p>
            <Link
              href={loginHref}
              className="mt-6 inline-block text-sm font-medium text-brand-deep hover:underline"
            >
              رفتن به صفحه ورود
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
