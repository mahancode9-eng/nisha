"use client";

import Link from "next/link";
import { SellerAuthGuard } from "@/components/auth/SellerAuthGuard";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/Button";

export default function SellerAppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { data: store } = useSellerFetch(() => storeApi.getStore(), []);

  const navItems = [
    { href: paths.seller.dashboard, label: "داشبورد", primary: true, group: "فروش", icon: "dashboard" as const },
    { href: paths.seller.analytics, label: "آمار فروش", group: "فروش", icon: "analytics" as const },
    { href: paths.seller.products, label: "محصولات", primary: true, group: "فروش", icon: "products" as const },
    { href: paths.seller.orders, label: "سفارش‌ها", primary: true, group: "فروش", icon: "orders" as const },
    { href: paths.seller.discounts, label: "تخفیف‌ها", group: "فروش", icon: "discounts" as const },
    { href: paths.seller.conversations, label: "گفتگوها", primary: true, group: "ارتباط", icon: "chat" as const },
    { href: paths.seller.customers, label: "مشتری‌ها", primary: true, group: "ارتباط", icon: "users" as const },
    { href: paths.seller.store, label: "تنظیمات فروشگاه", group: "مدیریت", icon: "store" as const },
    { href: paths.seller.paymentMethods, label: "پرداخت‌ها", group: "مدیریت", icon: "payments" as const },
    { href: paths.seller.subscription, label: "اشتراک", group: "مدیریت", icon: "subscription" as const },
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
        identityName={store?.name ?? user?.store_slug ?? null}
        identityImageUrl={store?.logo_url ? resolveMediaUrl(store.logo_url) : null}
        identityHref={store?.slug ? paths.store(store.slug) : null}
        identityOpenInNewTab
        navItems={navItems}
        onLogout={logout}
        topActions={
          <div className="flex flex-wrap items-center gap-2">
            <ThemeSwitcher variant="design" />
            {user?.store_slug ? (
              <Link
                href={paths.store(user.store_slug)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm">
                  دیدن فروشگاه
                </Button>
              </Link>
            ) : null}
          </div>
        }
      >
        {children}
      </WorkspaceShell>
    </SellerAuthGuard>
  );
}
