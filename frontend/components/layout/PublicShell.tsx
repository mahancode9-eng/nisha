"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type PublicNavItem = {
  href: string;
  label: string;
};

type PublicShellProps = {
  title?: string;
  subtitle?: string;
  navItems?: PublicNavItem[];
  actions?: ReactNode;
  showDefaultActions?: boolean;
  children: ReactNode;
};

export function PublicShell({
  title,
  subtitle,
  navItems = [],
  actions,
  showDefaultActions = true,
  children,
}: PublicShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:py-4">
          <div className="min-w-0 flex-1">
            <Link
              href={paths.home}
              className="text-xs font-medium tracking-[0.24em] text-foreground-muted hover:text-foreground"
            >
              نیـشا
            </Link>
            {title && <h1 className="truncate text-base font-semibold text-foreground lg:text-lg">{title}</h1>}
            {subtitle && <p className="hidden text-sm text-foreground-muted sm:block">{subtitle}</p>}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeSwitcher variant="button" />
            {actions}
            {showDefaultActions && (
              <>
                <Link href={paths.trackOrder}>
                  <Button variant="ghost" size="sm">پیگیری سفارش</Button>
                </Link>
                <Link href={paths.customer.dashboard}>
                  <Button variant="ghost" size="sm">پنل مشتری</Button>
                </Link>
                <Link href={paths.seller.login}>
                  <Button variant="secondary" size="sm">ورود فروشنده</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted md:hidden"
            aria-label="منو"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <ThemeSwitcher variant="button" />
              {actions}
              {showDefaultActions && (
                <>
                  <Link href={paths.trackOrder} onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">پیگیری سفارش</Button>
                  </Link>
                  <Link href={paths.customer.dashboard} onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">پنل مشتری</Button>
                  </Link>
                  <Link href={paths.seller.login} onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full justify-start">ورود فروشنده</Button>
                  </Link>
                </>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {navItems.length > 0 && (
          <div className="hidden border-t border-border bg-surface-muted/60 md:block">
            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors",
                    "bg-surface text-foreground shadow-sm ring-1 ring-border hover:bg-surface-muted",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-foreground-muted sm:px-6">
          پلتفرم نیشا
        </div>
      </footer>
    </div>
  );
}
