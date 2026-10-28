import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";

type BrandMarkProps = {
  showTagline?: boolean;
  /** Icon-only / denser mark for slim side rails. */
  compact?: boolean;
  className?: string;
};

/** Same minimal Nisha mark used in the public store header. */
export function BrandMark({ showTagline = false, compact = false, className }: BrandMarkProps) {
  return (
    <Link
      href={paths.home}
      aria-label="نیشا"
      title="نیشا"
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg p-1 transition hover:opacity-80",
        compact && "justify-center gap-0",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt=""
        className={cn(
          "object-contain",
          compact ? "h-8 w-8" : "h-8 w-8 sm:h-9 sm:w-9",
        )}
      />
      {!compact ? (
        <span className="min-w-0 leading-tight">
          <span className="block text-base font-semibold text-foreground max-md:text-sm">نیشا</span>
          {showTagline ? (
            <span className="hidden text-xs text-foreground-muted sm:block">فروشگاه‌ساز برای فروشنده‌ها</span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
