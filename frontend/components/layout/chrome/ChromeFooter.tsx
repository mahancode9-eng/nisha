import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";

type ChromeFooterProps = {
  variant?: "default" | "landing";
  className?: string;
};

export function ChromeFooter({ variant = "default", className }: ChromeFooterProps) {
  if (variant === "landing") {
    return (
      <footer
        className={cn(
          "relative z-10 border-t border-border/60 bg-background/75 backdrop-blur",
          className,
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-foreground-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>نیشا · فروشگاه‌ساز برای شروع سریع فروش</p>
          <Link href={paths.trackOrder} className="transition-colors hover:text-foreground">
            پیگیری سفارش
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("border-t border-border bg-surface", className)}>
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-foreground-muted sm:px-6">
        پلتفرم نیشا
      </div>
    </footer>
  );
}
