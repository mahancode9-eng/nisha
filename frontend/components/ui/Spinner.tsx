import { cn } from "@/lib/cn";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeClass = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
} as const;

/** Standard circular spinner used for page and inline loading. */
export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div
      className={cn("inline-flex flex-col items-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "داره بارگذاری می‌شه"}
    >
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-brand border-e-transparent",
          sizeClass[size],
        )}
        aria-hidden
      />
      {label ? <span className="text-sm text-foreground-muted">{label}</span> : null}
    </div>
  );
}
