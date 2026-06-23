"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

const navItems = [
  { href: paths.seller.dashboard, label: "داشبورد" },
  { href: paths.seller.store, label: "تنظیمات فروشگاه" },
  { href: paths.seller.products, label: "محصولات" },
  { href: paths.seller.paymentMethods, label: "روش‌های پرداخت" },
  { href: paths.seller.orders, label: "سفارشات" },
  { href: paths.seller.conversations, label: "پیام‌ها" },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push(paths.seller.login);
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <span className="font-semibold text-foreground">پنل فروشنده</span>
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
          {open ? "بستن" : "منو"}
        </Button>
      </div>
      <aside
        className={cn(
          "flex w-full flex-col border-r border-border bg-surface lg:w-64 lg:shrink-0",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="hidden border-b border-border px-4 py-5 lg:block">
          <p className="text-xs font-medium tracking-wide text-foreground-muted">
            فروشنده
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {user?.full_name}
          </p>
          <p className="truncate text-xs text-foreground-muted">{user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand/10 text-brand" : "text-foreground hover:bg-surface-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            خروج
          </Button>
        </div>
      </aside>
    </>
  );
}
