"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/ui/LoadingState";
import { verifyEmail, type VerifyEmailKind } from "@/lib/api/verify-email";
import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const kind = (searchParams.get("kind") ?? "customer") as VerifyEmailKind;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("این لینک تایید معتبر نیست یا منقضی شده است.");
      return;
    }
    verifyEmail(token, kind)
      .then(() => {
        setStatus("success");
        setMessage("ایمیلت تایید شد. حالا می‌تونی وارد شی.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "ایمیل تایید نشد. دوباره از لینک داخل ایمیل امتحان کن.");
      });
  }, [token, kind]);

  const loginHref = kind === "seller" ? paths.seller.login : paths.customer.login;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        {status === "loading" && <p className="text-foreground-muted">در حال تایید ایمیل…</p>}
        {status !== "loading" && (
          <>
            <h1 className="text-2xl font-bold text-foreground max-md:text-xl">
              {status === "success" ? "تایید شد" : "تایید نشد"}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState message="در حال بارگذاری…" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
