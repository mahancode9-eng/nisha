"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/chrome/BrandMark";
import { ChromeFooter } from "@/components/layout/chrome/ChromeFooter";
import { ChromeMobileDrawer } from "@/components/layout/chrome/ChromeMobileDrawer";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

type LandingShellProps = {
  children: ReactNode;
};

export function LandingShell({ children }: LandingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl animate-float-slow dark:bg-brand/15 dark:opacity-50" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-float-slower dark:bg-fuchsia-500/10 dark:opacity-40" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand/5 blur-3xl animate-drift dark:bg-brand/10 dark:opacity-30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <BrandMark showTagline />

          <div className="hidden items-center gap-2 md:flex">
            <ThemeSwitcher variant="button" />
            <Link href={paths.seller.login}>
              <Button variant="ghost" size="sm">ورود فروشنده</Button>
            </Link>
            <SellerPrimaryCta variant="secondary" size="sm" />
          </div>

          <button
            type="button"
            aria-label="باز و بسته کردن منو"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-sm transition-colors hover:bg-surface-muted md:hidden"
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

        <ChromeMobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} animate>
          <ThemeSwitcher variant="button" />
          <Link href={paths.seller.login} onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start">ورود فروشنده</Button>
          </Link>
          <Link href={paths.trackOrder} onClick={() => setMenuOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start">پیگیری سفارش</Button>
          </Link>
          <SellerPrimaryCta variant="secondary" size="md" className="w-full justify-start" />
        </ChromeMobileDrawer>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        {children}
      </main>

      <ChromeFooter variant="landing" />
    </div>
  );
}
