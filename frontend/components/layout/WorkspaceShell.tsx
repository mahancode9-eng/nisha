"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { UserChip } from "@/components/layout/chrome/UserChip";
import {
  inferNavGroup,
  inferNavIcon,
  NavIcon,
  type NavIconName,
} from "@/components/layout/chrome/NavIcons";
import { PanelAtmosphere } from "@/components/theme/PanelAtmosphere";
import { ThemeModeToggle } from "@/components/theme/GlobalThemeToggle";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useTheme } from "@/contexts/ThemeContext";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type ShellNavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: NavIconName;
  group?: string;
  primary?: boolean;
};

type WorkspaceShellProps = {
  variant: "sidebar" | "tabs";
  brandLabel: string;
  roleLabel: string;
  title: string;
  subtitle?: string;
  userName?: string | null;
  userMeta?: string | null;
  identityName?: string | null;
  identityImageUrl?: string | null;
  identityHref?: string | null;
  identityOpenInNewTab?: boolean;
  navItems: ShellNavItem[];
  onLogout: () => void;
  topActions?: ReactNode;
  children: ReactNode;
};

function HeaderIdentity({
  name,
  imageUrl,
  href,
  openInNewTab,
}: {
  name: string;
  imageUrl?: string | null;
  href?: string | null;
  openInNewTab?: boolean;
}) {
  const initial = name.trim().charAt(0) || "ن";
  const avatar = (
    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-surface shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand">
          {initial}
        </span>
      )}
    </span>
  );
  const label = (
    <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
      {name}
    </span>
  );
  const body = (
    <>
      {label}
      {avatar}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className="flex min-w-0 max-w-[11rem] items-center gap-2.5 rounded-xl transition hover:opacity-80 sm:max-w-[14rem]"
        title={name}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 max-w-[11rem] items-center gap-2.5 sm:max-w-[14rem]">{body}</div>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function enrichItems(items: ShellNavItem[]) {
  return items.map((item) => ({
    ...item,
    icon: item.icon ?? inferNavIcon(item.href, item.label),
    group: item.group ?? inferNavGroup(item.href, item.label),
  }));
}

function pickPrimaryItems(items: ReturnType<typeof enrichItems>) {
  const preferred = items.filter((item) => item.primary);
  if (preferred.length > 0) return preferred.slice(0, 4);

  const rank = (icon: NavIconName) => {
    const order: NavIconName[] = ["dashboard", "products", "orders", "chat", "analytics"];
    const idx = order.indexOf(icon);
    return idx === -1 ? 99 : idx;
  };

  return [...items].sort((a, b) => rank(a.icon) - rank(b.icon)).slice(0, 4);
}

export function WorkspaceShell({
  variant: _variant,
  brandLabel: _brandLabel,
  roleLabel,
  title,
  subtitle: _subtitle,
  userName,
  userMeta,
  identityName,
  identityImageUrl,
  identityHref,
  identityOpenInNewTab = false,
  navItems,
  onLogout,
  topActions,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const { designStyle, resolvedTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = useMemo(() => enrichItems(navItems), [navItems]);
  const primary = useMemo(() => pickPrimaryItems(items), [items]);
  const primaryHrefs = useMemo(() => new Set(primary.map((item) => item.href)), [primary]);
  const moreItems = useMemo(
    () => items.filter((item) => !primaryHrefs.has(item.href)),
    [items, primaryHrefs],
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [items]);

  const activeNav = useMemo(
    () => items.find((item) => isActive(pathname, item.href)) ?? items[0],
    [items, pathname],
  );

  const moreActive = moreItems.some((item) => isActive(pathname, item.href));
  const identityLabel = identityName?.trim() || userName?.trim() || null;
  const isGlass = designStyle === "glass";
  const showAtmosphere = designStyle === "saas" || designStyle === "glass";
  // Match store header: white mark over dark chrome (store uses this before scroll).
  const whiteMark = resolvedTheme === "dark" || isGlass;

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const closeMore = () => setMoreOpen(false);

  return (
    <div className={cn("relative min-h-screen", isGlass ? "vui-shell" : "bg-transparent")}>
      {showAtmosphere ? <PanelAtmosphere /> : null}

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 sm:gap-4 sm:p-4 lg:gap-5 lg:p-5">
        {/* Desktop floating rail */}
        <aside
          className={cn(
            "panel-rail sticky top-4 hidden h-[calc(100vh-2rem)] w-[4.5rem] shrink-0 flex-col overflow-hidden xl:w-[15rem] lg:flex",
            isGlass ? "vui-sidenav" : "border border-border bg-surface/75 shadow-sm backdrop-blur-2xl",
          )}
        >
          <div className="hidden items-center border-b border-border/50 px-4 py-4 xl:flex">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {roleLabel}
            </p>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4 xl:px-3">
            {groups.map(([group, groupItems]) => (
              <div key={group} className="space-y-1">
                <p className="mb-2 hidden px-2.5 text-[10px] font-semibold tracking-[0.18em] text-foreground-muted/80 xl:block">
                  {group}
                </p>
                <ul className="space-y-1">
                  {groupItems.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={item.label}
                          className={cn(
                            "panel-rail-link group relative flex items-center gap-3 rounded-2xl px-2 py-2 text-sm transition-all duration-200",
                            "justify-center xl:justify-start xl:px-2.5",
                            active
                              ? "bg-brand/12 text-foreground shadow-[inset_0_0_0_1px_rgb(var(--color-brand)/0.22)]"
                              : "text-foreground-muted hover:bg-surface-muted/80 hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute inset-y-2 end-0 w-1 rounded-full bg-brand transition-opacity xl:end-auto xl:start-0",
                              active ? "opacity-100" : "opacity-0",
                            )}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "grid h-10 w-10 place-items-center rounded-xl transition-colors",
                              active
                                ? "bg-brand text-brand-foreground shadow-sm"
                                : "bg-surface-muted/70 text-foreground-muted group-hover:bg-brand/10 group-hover:text-brand",
                            )}
                          >
                            <NavIcon name={item.icon} className="h-[1.15rem] w-[1.15rem]" />
                          </span>
                          <span className="hidden min-w-0 flex-1 truncate font-medium xl:block">
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-border/50 p-2.5 xl:p-3">
            <div className="hidden xl:block">
              <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.16em] text-foreground-muted/80">
                {roleLabel}
              </p>
              <UserChip userName={userName} userMeta={userMeta} className="w-full" />
            </div>
            {topActions ? <div className="hidden space-y-2 xl:block">{topActions}</div> : null}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center rounded-xl xl:justify-start"
              onClick={onLogout}
              title="خروج"
            >
              <span className="xl:hidden">خروج</span>
              <span className="hidden xl:inline">خروج از حساب</span>
            </Button>
          </div>
        </aside>

        {/* Content column */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          <header
            className={cn(
              "panel-topbar sticky top-4 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl px-3 py-2.5 sm:px-4",
              isGlass
                ? "vui-navbar"
                : "border border-border bg-surface/70 shadow-sm backdrop-blur-2xl",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5 justify-self-start">
              {activeNav ? (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
                  <NavIcon name={activeNav.icon} className="h-[1.05rem] w-[1.05rem]" />
                </span>
              ) : null}
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {activeNav?.label ?? title}
              </h1>
            </div>

            <Link
              href={paths.home}
              className="justify-self-center rounded-lg p-1 transition hover:opacity-80"
              aria-label="نیشا"
              title="نیشا"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.png"
                alt=""
                className={cn(
                  "h-7 w-7 object-contain sm:h-8 sm:w-8",
                  whiteMark && "brightness-0 invert drop-shadow-sm",
                )}
              />
            </Link>

            <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 justify-self-end sm:gap-2">
              <ThemeModeToggle />
              <div className="hidden lg:block xl:hidden">{topActions}</div>
              {identityLabel ? (
                <HeaderIdentity
                  name={identityLabel}
                  imageUrl={identityImageUrl}
                  href={identityHref}
                  openInNewTab={identityOpenInNewTab}
                />
              ) : (
                <div className="hidden sm:block lg:hidden">
                  <UserChip userName={userName} userMeta={userMeta} />
                </div>
              )}
            </div>
          </header>

          <main
            className={cn(
              "min-w-0 flex-1",
              "pb-[calc(6.25rem+env(safe-area-inset-bottom))] lg:pb-2",
            )}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Floating mobile dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <nav
          className={cn(
            "panel-dock pointer-events-auto mx-auto max-w-md rounded-[1.75rem] border border-border p-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.18)] backdrop-blur-2xl",
            isGlass
              ? "border-[rgb(var(--glass-border))] bg-[rgb(var(--glass-fill))]"
              : "bg-surface/90",
          )}
          aria-label="منوی پایین"
        >
          <ul className="grid grid-cols-5 gap-0.5">
            {primary.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMore}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-all duration-200",
                      active ? "text-brand" : "text-foreground-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-2xl transition-all duration-200",
                        active
                          ? "scale-105 bg-brand text-brand-foreground shadow-sm"
                          : "bg-transparent",
                      )}
                    >
                      <NavIcon name={item.icon} className="h-4.5 w-4.5 h-[1.1rem] w-[1.1rem]" />
                    </span>
                    <span className="max-w-full truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-all duration-200",
                  moreOpen || moreActive ? "text-brand" : "text-foreground-muted",
                )}
                aria-expanded={moreOpen}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-2xl transition-all duration-200",
                    moreOpen || moreActive
                      ? "scale-105 bg-brand text-brand-foreground shadow-sm"
                      : "bg-transparent",
                  )}
                >
                  <NavIcon name="more" className="h-[1.1rem] w-[1.1rem]" />
                </span>
                <span>بیشتر</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* More sheet */}
      {moreOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label="بستن"
            onClick={closeMore}
          />
          <div
            className={cn(
              "absolute inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto rounded-[1.75rem] border border-border bg-surface p-4 shadow-2xl",
              "animate-reveal-up",
              isGlass && "glass-panel border-[rgb(var(--glass-border))]",
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">بیشتر</p>
                <p className="text-xs text-foreground-muted">{roleLabel}</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={closeMore}>
                بستن
              </Button>
            </div>

            <UserChip userName={userName} userMeta={userMeta} className="mb-3 w-full" />

            <ul className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMore}
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-2xl border border-border/70 px-3 py-3 transition",
                        active
                          ? "border-brand/30 bg-brand/10 text-brand"
                          : "bg-surface-muted/40 text-foreground hover:bg-surface-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-xl",
                          active ? "bg-brand text-brand-foreground" : "bg-surface text-brand",
                        )}
                      >
                        <NavIcon name={item.icon} />
                      </span>
                      <span className="text-sm font-medium leading-5">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div>
                <p className="mb-2 text-xs font-medium text-foreground-muted">حالت رنگ</p>
                <ThemeSwitcher variant="group" />
              </div>
              {topActions ? (
                <div className="space-y-2" onClick={closeMore}>
                  {topActions}
                </div>
              ) : null}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start rounded-xl"
              onClick={() => {
                closeMore();
                onLogout();
              }}
            >
              خروج از حساب
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
