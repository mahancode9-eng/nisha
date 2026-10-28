"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/chrome/BrandMark";
import { ChromeFooter } from "@/components/layout/chrome/ChromeFooter";
import {
  ChromeMenuToggle,
  ChromeMobileDrawer,
  MobileNavLink,
} from "@/components/layout/chrome/ChromeMobileDrawer";
import { LandingAtmosphere } from "@/components/landing/LandingAtmosphere";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import "@/app/landing.css";

type LandingShellProps = {
  children: ReactNode;
};

export function LandingShell({ children }: LandingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div data-landing className="relative flex min-h-screen flex-col bg-[#09090b] text-foreground">
      <LandingAtmosphere />

      <div className="relative flex min-h-screen flex-1 flex-col">
        <header className={cn("landing-header sticky top-0 z-40", scrolled && "is-scrolled")}>
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
            <BrandMark showTagline={false} />

            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="#features"
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                امکانات
              </Link>
              <Link
                href="#how"
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                نحوه کار
              </Link>
              <Link
                href="#pricing"
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                قیمت‌ها
              </Link>
              <Link
                href={paths.about}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                درباره ما
              </Link>
              <div className="ms-2 flex items-center gap-2">
                <Link
                  href={paths.seller.login}
                  className={landingButtonClasses({ variant: "ghost", size: "sm" })}
                >
                  ورود
                </Link>
                <SellerPrimaryCta variant="primary" size="sm" guestLabel="شروع رایگان" />
              </div>
            </nav>

            <ChromeMenuToggle
              open={menuOpen}
              onToggle={() => setMenuOpen((open) => !open)}
            />
          </div>
        </header>

        <main className="relative z-10 w-full flex-1 pb-20 pt-2 sm:pt-4">
          {children}
        </main>

        <ChromeFooter variant="landing" />
      </div>

      <ChromeMobileDrawer open={menuOpen} onClose={closeMenu}>
        <MobileNavLink href="#features" onClose={closeMenu}>
          <span className="block w-full rounded-lg px-3 py-2 text-start text-sm">امکانات</span>
        </MobileNavLink>
        <MobileNavLink href="#how" onClose={closeMenu}>
          <span className="block w-full rounded-lg px-3 py-2 text-start text-sm">نحوه کار</span>
        </MobileNavLink>
        <MobileNavLink href="#pricing" onClose={closeMenu}>
          <span className="block w-full rounded-lg px-3 py-2 text-start text-sm">قیمت‌ها</span>
        </MobileNavLink>
        <MobileNavLink href={paths.about} onClose={closeMenu}>
          <span className="block w-full rounded-lg px-3 py-2 text-start text-sm">درباره ما</span>
        </MobileNavLink>
        <MobileNavLink href={paths.trackOrder} onClose={closeMenu}>
          <span className="block w-full rounded-lg px-3 py-2 text-start text-sm">پیگیری سفارش</span>
        </MobileNavLink>
        <MobileNavLink href={paths.seller.login} onClose={closeMenu}>
          <span className="block w-full rounded-lg px-3 py-2 text-start text-sm">ورود فروشنده</span>
        </MobileNavLink>
        <div onClickCapture={closeMenu} className="px-1 pt-2">
          <SellerPrimaryCta variant="primary" size="md" className="w-full" guestLabel="شروع رایگان" />
        </div>
      </ChromeMobileDrawer>
    </div>
  );
}
