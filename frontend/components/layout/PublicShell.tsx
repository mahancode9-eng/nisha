"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/chrome/BrandMark";
import { ChromeFooter } from "@/components/layout/chrome/ChromeFooter";
import { ChromeHeader } from "@/components/layout/chrome/ChromeHeader";
import { ChromeMobileDrawer, MobileNavLink } from "@/components/layout/chrome/ChromeMobileDrawer";
import { ChromeNav, type ChromeNavItem } from "@/components/layout/chrome/ChromeNav";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

export type PublicNavItem = ChromeNavItem;

type PublicShellProps = {
  title?: string;
  subtitle?: string;
  navItems?: PublicNavItem[];
  actions?: ReactNode;
  mobileActions?: ReactNode;
  showDefaultActions?: boolean;
  children: ReactNode;
};

export function PublicShell({
  title,
  subtitle,
  navItems = [],
  actions,
  mobileActions,
  showDefaultActions = true,
  children,
}: PublicShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const defaultActions = showDefaultActions ? (
    <>
      <Link href={paths.pricing}>
        <Button variant="ghost" size="sm">قیمت‌ها</Button>
      </Link>
      <Link href={paths.about}>
        <Button variant="ghost" size="sm">درباره ما</Button>
      </Link>
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
  ) : null;

  const headerActions = (
    <>
      {actions}
      {defaultActions}
    </>
  );

  const mobileMenu = (
    <>
      {showDefaultActions && (
        <>
          <MobileNavLink href={paths.pricing} onClose={closeMenu}>
            <Button variant="ghost" size="sm" className="w-full justify-start">قیمت‌ها</Button>
          </MobileNavLink>
          <MobileNavLink href={paths.about} onClose={closeMenu}>
            <Button variant="ghost" size="sm" className="w-full justify-start">درباره ما</Button>
          </MobileNavLink>
          <MobileNavLink href={paths.trackOrder} onClose={closeMenu}>
            <Button variant="ghost" size="sm" className="w-full justify-start">پیگیری سفارش</Button>
          </MobileNavLink>
          <MobileNavLink href={paths.customer.dashboard} onClose={closeMenu}>
            <Button variant="ghost" size="sm" className="w-full justify-start">پنل مشتری</Button>
          </MobileNavLink>
          <MobileNavLink href={paths.seller.login} onClose={closeMenu}>
            <Button variant="secondary" size="sm" className="w-full justify-start">ورود فروشنده</Button>
          </MobileNavLink>
        </>
      )}
      {navItems.map((item) => (
        <MobileNavLink
          key={item.href}
          href={item.href}
          onClose={closeMenu}
          className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
        >
          {item.label}
        </MobileNavLink>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ChromeHeader
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        brand={
          title ? (
            <Link
              href={paths.home}
              className="text-xs font-medium tracking-[0.24em] text-foreground-muted hover:text-foreground"
            >
              نیـشا
            </Link>
          ) : (
            <BrandMark />
          )
        }
        title={title}
        subtitle={subtitle}
        actions={headerActions}
        mobileActions={mobileActions}
        secondaryNav={
          navItems.length > 0 ? (
            <div className="hidden border-t border-border bg-surface-muted/60 md:block">
              <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
                <ChromeNav items={navItems} variant="pills" />
              </div>
            </div>
          ) : undefined
        }
      />

      <ChromeMobileDrawer open={menuOpen} onClose={closeMenu}>
        {mobileMenu}
      </ChromeMobileDrawer>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <ChromeFooter />
    </div>
  );
}
