"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { cn } from "@/lib/cn";
import { paths } from "@/lib/auth/paths";

type LandingShellProps = {
  children: ReactNode;
};

export function LandingShell({ children }: LandingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl animate-float-slow dark:bg-brand/15 dark:opacity-55" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-float-slower dark:bg-fuchsia-500/10 dark:opacity-45" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand/5 blur-3xl animate-drift dark:bg-brand/10 dark:opacity-35" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href={paths.home} className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-base font-bold text-brand ring-1 ring-brand/20 dark:bg-brand/15 dark:text-brand-deep dark:ring-brand/30">
              ن
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-base font-semibold text-foreground">نیشا</span>
              <span className="hidden text-xs text-foreground-muted sm:block">فروشگاه‌ساز برای فروشندگان</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeSwitcher variant="button" />
            <Link href={paths.seller.login} className={landingButtonClasses({ variant: "ghost", size: "sm" })}>
              ورود فروشنده
            </Link>
            <SellerPrimaryCta variant="secondary" size="sm" guestLabel="شروع فروش" sellerLabel="داشبورد" />
          </div>

          <button
            type="button"
            aria-label="باز و بسته کردن منو"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-sm transition-colors hover:bg-surface-muted dark:border-border/70 dark:bg-surface/80 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 7h16" strokeLinecap="round" />
                  <path d="M4 12h16" strokeLinecap="round" />
                  <path d="M4 17h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden border-t border-border/70 bg-background/90 transition-all duration-300 md:hidden",
            menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
            <ThemeSwitcher variant="button" />
            <Link
              href={paths.seller.login}
              onClick={() => setMenuOpen(false)}
              className={landingButtonClasses({ variant: "ghost", size: "md", className: "w-full justify-start" })}
            >
              ورود فروشنده
            </Link>
            <Link
              href={paths.trackOrder}
              onClick={() => setMenuOpen(false)}
              className={landingButtonClasses({ variant: "ghost", size: "md", className: "w-full justify-start" })}
            >
              پیگیری سفارش
            </Link>
            <SellerPrimaryCta
              variant="secondary"
              size="md"
              className="w-full justify-start"
              guestLabel="شروع فروش"
              sellerLabel="داشبورد"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-background/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-foreground-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>نیشا · فروشگاه‌ساز مدرن برای فروشندگان</p>
          <Link href={paths.trackOrder} className="transition-colors hover:text-foreground">
            پیگیری سفارش
          </Link>
        </div>
      </footer>
    </div>
  );
}
