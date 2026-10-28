"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as storesApi from "@/lib/api/public/stores";
import { CartDrawer } from "@/components/store/CartDrawer";
import { StoreChromeProvider, useStoreChrome } from "@/components/store/StoreChromeContext";
import { StoreHamburgerMenu } from "@/components/store/StoreHamburgerMenu";
import { ThemeModeToggle } from "@/components/theme/GlobalThemeToggle";
import { PanelAtmosphere } from "@/components/theme/PanelAtmosphere";
import { SectionTravelProvider } from "@/components/ui/SectionTravel";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { isDesignStyle, type DesignStyle } from "@/lib/theme";
import { Button } from "@/components/ui/Button";

const FOOTER_LINKS = [
  { href: "/track-order", label: "پیگیری سفارش" },
  { href: "/terms", label: "قوانین" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/complaints", label: "شکایت" },
];

function headerIconBtn(extra?: string) {
  return cn(
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/90 text-foreground shadow-sm backdrop-blur-xl transition",
    "hover:border-brand/40 hover:bg-surface-muted",
    extra,
  );
}

function StoreCartButton({ onClick }: { onClick: () => void }) {
  const { itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        headerIconBtn(),
        "relative sm:w-auto sm:gap-2 sm:px-3",
        itemCount > 0 && "border-brand/30",
      )}
      aria-label={`سبد خرید${itemCount > 0 ? `، ${itemCount} کالا` : ""}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
        <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      <span className="hidden sm:inline text-sm font-medium">سبد</span>
      {itemCount > 0 ? (
        <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold tabular-nums text-brand-foreground sm:static sm:ms-0.5 sm:h-5 sm:min-w-5 sm:text-[11px]">
          {itemCount > 9 ? "۹+" : itemCount.toLocaleString("fa-IR")}
        </span>
      ) : null}
    </button>
  );
}

function StoreAuthButton({ storeSlug }: { storeSlug: string }) {
  const pathname = usePathname();
  const { customer, isLoading } = useCustomerAuth();
  const redirectTarget = pathname || paths.store(storeSlug);
  const loginHref = `${paths.customer.login}?redirect=${encodeURIComponent(redirectTarget)}`;

  if (isLoading) {
    return <span className="inline-block h-10 w-10 shrink-0 rounded-xl border border-border/60 bg-surface-muted/50" aria-hidden />;
  }

  if (customer) {
    const label = customer.full_name?.trim() || customer.email || "حساب من";
    const initial = label.charAt(0).toUpperCase();
    return (
      <Link
        href={paths.customer.dashboard}
        className={cn(headerIconBtn(), "sm:w-auto sm:max-w-[9.5rem] sm:gap-2 sm:px-2.5")}
        title={label}
        aria-label={`حساب کاربری: ${label}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-[11px] font-semibold text-brand">
          {initial}
        </span>
        <span className="hidden truncate text-sm font-medium sm:inline">{label.split(" ")[0]}</span>
      </Link>
    );
  }

  return (
    <Link href={loginHref} className={headerIconBtn()} aria-label="ورود" title="ورود">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 19.5c1.6-3.2 4-4.75 6.5-4.75s4.9 1.55 6.5 4.75" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

function StoreShellInner({
  slug,
  storeName,
  storeDesign,
  children,
}: {
  slug: string;
  storeName: string;
  storeDesign: DesignStyle;
  children: ReactNode;
}) {
  const { setDesignOverride, activeDesignStyle } = useTheme();
  const { menuOpen, setMenuOpen } = useStoreChrome();
  const [cartOpen, setCartOpen] = useState(false);
  const showAtmosphere = activeDesignStyle === "saas" || activeDesignStyle === "glass";
  const isGlass = activeDesignStyle === "glass";

  useEffect(() => {
    setDesignOverride(storeDesign);
    return () => setDesignOverride(null);
  }, [storeDesign, setDesignOverride]);

  return (
    <div className={cn("relative min-h-screen", isGlass && "vui-shell")}>
      {showAtmosphere ? <PanelAtmosphere /> : null}

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-[1600px] flex-col gap-2.5 p-2.5 sm:gap-4 sm:p-4 lg:p-5">
        <header
          className={cn(
            "sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 -mx-2.5 px-2.5 py-2 sm:top-3 sm:mx-0 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5",
            isGlass
              ? "vui-navbar"
              : "border-b border-border/60 bg-surface/95 shadow-sm backdrop-blur-2xl sm:border sm:border-border",
          )}
        >
          <div className="justify-self-start">
            <button
              type="button"
              className={headerIconBtn()}
              aria-label="منوی فروشگاه"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <Link
            href={paths.home}
            className="justify-self-center rounded-lg p-1 opacity-90 transition hover:opacity-100"
            aria-label="نیشا"
            title="نیشا"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
          </Link>

          <div className="flex shrink-0 items-center justify-end gap-1 justify-self-end sm:gap-2">
            <Link href={paths.trackOrder} className="hidden lg:inline-flex">
              <Button variant="ghost" size="sm" className="rounded-xl">
                پیگیری سفارش
              </Button>
            </Link>
            <ThemeModeToggle className="hidden sm:inline-flex" />
            <StoreAuthButton storeSlug={slug} />
            <div className="lg:hidden">
              <StoreCartButton onClick={() => setCartOpen(true)} />
            </div>
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start">
          <main className="min-w-0 flex-1 pb-6 sm:pb-4">{children}</main>
          <CartDrawer open={cartOpen} slug={slug} onClose={() => setCartOpen(false)} />
        </div>

        <footer
          className={cn(
            "mt-auto hidden rounded-2xl border border-border px-4 py-4 sm:block",
            isGlass ? "glass-panel" : "bg-surface/60 backdrop-blur-xl",
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-start">
            <p className="text-xs text-foreground-muted">
              میزبانی‌شده روی{" "}
              <Link href={paths.home} className="font-medium text-foreground hover:underline">
                نیشا
              </Link>
            </p>
            <nav aria-label="لینک‌های حقوقی" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-foreground-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>

      <StoreHamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} storeName={storeName} />
    </div>
  );
}

export function StoreLayoutWrapper({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [storeName, setStoreName] = useState(slug);
  const [storeDesign, setStoreDesign] = useState<DesignStyle>("saas");

  useEffect(() => {
    let cancelled = false;
    storesApi
      .getStoreBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setStoreName(data.store.name);
        setStoreDesign(isDesignStyle(data.store.design_style) ? data.store.design_style : "saas");
      })
      .catch(() => {
        if (cancelled) return;
        setStoreName(slug);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <CartProvider key={slug} slug={slug}>
      <StoreChromeProvider>
        <SectionTravelProvider>
          <StoreShellInner slug={slug} storeName={storeName} storeDesign={storeDesign}>
            {children}
          </StoreShellInner>
        </SectionTravelProvider>
      </StoreChromeProvider>
    </CartProvider>
  );
}
