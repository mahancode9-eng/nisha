"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { ChromeNav, type ChromeNavItem } from "@/components/layout/chrome/ChromeNav";
import {
  ChromeMenuToggle,
  ChromeMobileDrawer,
} from "@/components/layout/chrome/ChromeMobileDrawer";
import { UserChip } from "@/components/layout/chrome/UserChip";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type ShellNavItem = ChromeNavItem;

type WorkspaceShellProps = {
  variant: "sidebar" | "tabs";
  brandLabel: string;
  roleLabel: string;
  title: string;
  subtitle?: string;
  userName?: string | null;
  userMeta?: string | null;
  navItems: ShellNavItem[];
  onLogout: () => void;
  topActions?: ReactNode;
  children: ReactNode;
};

export function WorkspaceShell({
  variant,
  brandLabel,
  roleLabel,
  title,
  subtitle,
  userName,
  userMeta,
  navItems,
  onLogout,
  topActions,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeNav = useMemo(
    () =>
      navItems.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
      ) ?? navItems[0],
    [navItems, pathname],
  );

  if (variant === "tabs") {
    const closeMenu = () => setMenuOpen(false);

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 md:hidden">
            <ChromeMenuToggle open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
              {activeNav?.label ?? title}
            </h1>
            <ThemeSwitcher variant="button" />
          </div>

          <div className="mx-auto hidden max-w-7xl px-4 py-3 sm:px-6 md:block">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={paths.home}
                className="min-w-0 truncate text-sm text-foreground-muted hover:text-foreground"
              >
                <span className="font-medium text-foreground">{brandLabel}</span>
                <span className="mx-1.5 text-border">·</span>
                <span>{roleLabel}</span>
              </Link>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <UserChip userName={userName} userMeta={userMeta} />
                <ThemeSwitcher variant="button" />
                {topActions}
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  خروج
                </Button>
              </div>
            </div>
            <ChromeNav
              items={navItems}
              variant="pills"
              scrollable={navItems.length > 5}
              compact
              className="mt-2"
            />
          </div>
        </header>

        <ChromeMobileDrawer open={menuOpen} onClose={closeMenu}>
          <div className="space-y-1 border-b border-border pb-4">
            <Link
              href={paths.home}
              onClick={closeMenu}
              className="text-xs font-medium tracking-[0.24em] text-foreground-muted hover:text-foreground"
            >
              {brandLabel}
            </Link>
            <p className="text-xs tracking-[0.2em] text-brand-deep">{roleLabel}</p>
          </div>
          <UserChip
            userName={userName}
            userMeta={userMeta}
            className="mt-3 max-md:px-2.5 max-md:py-1.5"
          />
          <ChromeNav
            items={navItems}
            variant="sidebar"
            onNavigate={closeMenu}
            className="mt-3"
          />
          {topActions && (
            <div className="mt-4" onClick={closeMenu}>
              {topActions}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full justify-start"
            onClick={() => {
              closeMenu();
              onLogout();
            }}
          >
            خروج
          </Button>
          {subtitle && (
            <p className="mt-4 text-xs leading-relaxed text-foreground-muted">{subtitle}</p>
          )}
        </ChromeMobileDrawer>

        <main className="mx-auto max-w-7xl p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex lg:flex-row">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div>
          <p className="text-xs tracking-[0.2em] text-foreground-muted">{roleLabel}</p>
          <p className="font-semibold text-foreground">{activeNav?.label ?? title}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMenuOpen((current) => !current)}>
          {menuOpen ? "بستن" : "منو"}
        </Button>
      </div>

      <aside
        className={cn(
          "flex w-full flex-col border-e border-border bg-surface lg:w-72 lg:shrink-0",
          menuOpen ? "block" : "hidden lg:flex",
        )}
      >
        <div className="border-b border-border px-5 py-5">
          <Link
            href={paths.home}
            className="text-xs font-medium tracking-[0.24em] text-foreground-muted hover:text-foreground"
          >
            {brandLabel}
          </Link>
          <p className="mt-1 text-sm tracking-[0.2em] text-brand-deep">{roleLabel}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>}
          <UserChip userName={userName} userMeta={userMeta} className="mt-4 block w-full" />
        </div>

        <div className="flex-1 p-3">
          <ChromeNav
            items={navItems}
            variant="sidebar"
            onNavigate={() => setMenuOpen(false)}
          />
        </div>

        <div className="border-t border-border p-3">
          <ThemeSwitcher variant="group" />
          {topActions && <div className="mt-3">{topActions}</div>}
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={onLogout}>
            خروج
          </Button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-3 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
