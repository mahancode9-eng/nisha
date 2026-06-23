"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { paths } from "@/lib/auth/paths";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href={paths.home} className="text-lg font-semibold tracking-tight text-foreground">
          Nisha
        </Link>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ThemeSwitcher variant="button" />
          <Link href={paths.trackOrder}>
            <Button variant="ghost" size="sm">
              پیگیری سفارش
            </Button>
          </Link>
          <Link href={paths.customer.dashboard}>
            <Button variant="ghost" size="sm">
              پنل مشتری
            </Button>
          </Link>
          <Link href={paths.customer.login}>
            <Button variant="ghost" size="sm">
              ورود مشتری
            </Button>
          </Link>
          <Link href={paths.seller.login}>
            <Button variant="ghost" size="sm">
              ورود فروشنده
            </Button>
          </Link>
          <Link href={paths.seller.register}>
            <Button variant="secondary" size="sm">
              ثبت‌نام
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
