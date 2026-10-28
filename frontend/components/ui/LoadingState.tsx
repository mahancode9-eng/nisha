import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

type LoadingStateProps = {
  message?: string;
  className?: string;
  /** @deprecated Ignored — kept so existing call sites keep type-checking. */
  orbState?: string;
};

export function LoadingState({
  message = "داره بارگذاری می‌شه…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] flex-col items-center justify-center gap-3 px-6 py-12 text-foreground-muted",
        className,
      )}
    >
      <Spinner size="lg" label={message} />
    </div>
  );
}
