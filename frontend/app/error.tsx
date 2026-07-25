"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium tracking-wide text-brand">خطا</p>
      <h1 className="text-2xl font-bold text-foreground">مشکلی پیش آمد</h1>
      <p className="text-sm text-muted-foreground">
        صفحه الان درست بارگذاری نشد. یک‌بار دیگر امتحان کن یا به صفحه اصلی برگرد.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          تلاش دوباره
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          صفحه اصلی
        </Link>
      </div>
    </main>
  );
}
