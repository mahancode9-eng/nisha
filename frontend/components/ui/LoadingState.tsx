import { cn } from "@/lib/cn";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "در حال بارگذاری...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-foreground-muted shadow-sm",
        className,
      )}
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent"
        aria-hidden
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}
