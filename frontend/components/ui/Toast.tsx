"use client";

import { cn } from "@/lib/cn";

type ToastItem = {
  id: number;
  message: string;
  variant: "success" | "error" | "warning";
};

type ToastContainerProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 end-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg",
        toast.variant === "success"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
          : toast.variant === "warning"
            ? "border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : "border-red-500/20 bg-red-500/10 text-red-900 dark:text-red-100",
      )}
      role={toast.variant === "error" ? "alert" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{toast.message}</p>
        <button
          type="button"
          className="shrink-0 text-foreground-muted hover:text-foreground"
          onClick={() => onDismiss(toast.id)}
          aria-label="بستن"
        >
          ×
        </button>
      </div>
    </div>
  );
}
