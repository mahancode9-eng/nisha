"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type ShellNavItem = {
  href: string;
  label: string;
  description?: string;
};

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

function AppearanceSection() {
  return (
    <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 space-y-1">
        <p className="text-xs tracking-[0.22em] text-foreground-muted">ظاهر</p>
        <p className="text-sm text-foreground-muted">حالت روشن، تیره، یا بر اساس تنظیمات سیستم.</p>
      </div>
      <ThemeSwitcher variant="group" />
    </section>
  );
}

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
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <Link
                  href={paths.home}
                  className="text-xs font-medium tracking-[0.24em] text-foreground-muted hover:text-foreground"
                >
                  {brandLabel}
                </Link>
                <p className="text-xs tracking-[0.2em] text-brand-deep">{roleLabel}</p>
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                {subtitle && <p className="max-w-3xl text-sm text-foreground-muted">{subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {topActions}
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  خروج
                </Button>
              </div>
            </div>
            <nav className="mt-4 flex flex-wrap gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm transition-colors",
                      active
                        ? "bg-brand text-brand-foreground"
                        : "bg-surface text-foreground-muted hover:bg-surface-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 max-w-md">
              <AppearanceSection />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
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
          "flex w-full flex-col border-r border-border bg-surface lg:w-72 lg:shrink-0",
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
          {(userName || userMeta) && (
            <div className="mt-4 rounded-2xl bg-surface-muted p-4">
              {userName && <p className="text-sm font-medium text-foreground">{userName}</p>}
              {userMeta && <p className="text-xs text-foreground-muted">{userMeta}</p>}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm transition-colors",
                  active
                    ? "bg-brand-soft text-brand-deep"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <span className="block font-medium">{item.label}</span>
                {item.description && (
                  <span className="mt-1 block text-xs text-foreground-muted">{item.description}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <AppearanceSection />
          {topActions && <div className="mt-3">{topActions}</div>}
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={onLogout}>
            خروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
