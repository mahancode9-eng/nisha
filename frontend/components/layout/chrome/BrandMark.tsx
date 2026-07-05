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
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-base font-bold text-brand ring-1 ring-brand/20 dark:bg-brand/15 dark:text-brand-deep dark:ring-brand/30">
        ن
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-base font-semibold text-foreground">نیشا</span>
        {showTagline && (
          <span className="hidden text-xs text-foreground-muted sm:block">فروشگاه‌ساز برای فروشندگان</span>
        )}
      </span>
    </Link>
  );
}
