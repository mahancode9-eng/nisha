"use client";

import Link from "next/link";
import { SellerAuthGuard } from "@/components/auth/SellerAuthGuard";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

export default function SellerAppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const navItems = [
    { href: paths.seller.dashboard, label: "داشبورد" },
    { href: paths.seller.analytics, label: "آمار فروش" },
    { href: paths.seller.store, label: "تنظیمات فروشگاه" },
    { href: paths.seller.products, label: "محصولات" },
    { href: paths.seller.orders, label: "سفارش‌ها" },
    { href: paths.seller.discounts, label: "تخفیف‌ها" },
    { href: paths.seller.conversations, label: "گفتگوها" },
    { href: paths.seller.paymentMethods, label: "پرداخت‌ها" },
    { href: paths.seller.subscription, label: "اشتراک" },
  ];

  return (
    <SellerAuthGuard>
      <WorkspaceShell
        variant="tabs"
        brandLabel="Nisha"
        roleLabel="مرکز فروشنده"
        title="مدیریت فروشگاه"
        userName={user?.full_name ?? null}
        userMeta={user?.email ?? user?.store_slug ?? null}
        navItems={navItems}
        onLogout={logout}
        topActions={
          user?.store_slug ? (
            <Link
              href={paths.store(user.store_slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm">
                مشاهده فروشگاه
              </Button>
            </Link>
          ) : undefined
        }
      >
        {children}
      </WorkspaceShell>
    </SellerAuthGuard>
  );
}
