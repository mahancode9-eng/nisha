import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";

type ChromeFooterProps = {
  variant?: "default" | "landing";
  className?: string;
};

const PRODUCT_LINKS = [
  { href: paths.pricing, label: "قیمت‌ها" },
  { href: paths.about, label: "درباره ما" },
  { href: paths.trackOrder, label: "پیگیری سفارش" },
] as const;

const LEGAL_LINKS = [
  { href: paths.terms, label: "شرایط استفاده" },
  { href: paths.privacy, label: "حریم خصوصی" },
  { href: paths.complaintsPolicy, label: "شکایات" },
] as const;

export function ChromeFooter({ variant = "default", className }: ChromeFooterProps) {
  const isLanding = variant === "landing";

  return (
    <footer
      className={cn(
        "relative z-10 border-t",
        isLanding
          ? "border-border/60 bg-background/75 backdrop-blur"
          : "border-border bg-surface",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-foreground">نیشا</p>
            <p className="max-w-xs text-sm text-foreground-muted">
              فروشگاه‌ساز برای شروع سریع فروش، بدون کارمزد روی سفارش مشتری.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:gap-12">
            <div>
              <p className="mb-3 font-medium text-foreground">محصول</p>
              <ul className="space-y-2 text-foreground-muted">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium text-foreground">قوانین</p>
              <ul className="space-y-2 text-foreground-muted">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="border-t border-border/60 pt-4 text-center text-xs text-foreground-muted sm:text-start">
          پلتفرم نیشا
        </p>
      </div>
    </footer>
  );
}
