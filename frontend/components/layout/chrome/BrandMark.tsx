import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";

type BrandMarkProps = {
  showTagline?: boolean;
  className?: string;
};

export function BrandMark({ showTagline = false, className }: BrandMarkProps) {
  return (
    <Link href={paths.home} className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/20 max-md:h-9 max-md:w-9 max-md:rounded-xl dark:bg-brand/15 dark:ring-brand/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="نیشا" className="h-7 w-7 max-md:h-6 max-md:w-6" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-base font-semibold text-foreground max-md:text-sm">نیشا</span>
        {showTagline && (
          <span className="hidden text-xs text-foreground-muted sm:block">فروشگاه‌ساز برای فروشندگان</span>
        )}
      </span>
    </Link>
  );
}
