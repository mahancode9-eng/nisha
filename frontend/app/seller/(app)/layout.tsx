"use client";

import Link from "next/link";
import { SellerAuthGuard } from "@/components/auth/SellerAuthGuard";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { SellerStoreProvider, useSellerStore } from "@/contexts/SellerStoreContext";
import { RoleForbidden } from "@/components/seller/RoleForbidden";
import { StoreSwitcher } from "@/components/seller/StoreSwitcher";
import { LoadingState } from "@/components/ui/LoadingState";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { areaForPath } from "@/lib/seller/areas";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/Button";

export default function SellerAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerAuthGuard>
      <SellerStoreProvider>
        <SellerShell>{children}</SellerShell>
      </SellerStoreProvider>
    </SellerAuthGuard>
  );
}

function SellerShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { activeStore, isReady, can, forbidden } = useSellerStore();
  const canStore = can("store");
  const { data: store } = useSellerFetch(
    () => (isReady && canStore ? storeApi.getStore() : Promise.resolve(null)),
    [isReady, canStore, activeStore?.store_id],
  );

  const allNavItems = [
    { href: paths.seller.dashboard, label: "داشبورد", primary: true, group: "فروش", icon: "dashboard" as const },
    { href: paths.seller.analytics, label: "آمار فروش", group: "فروش", icon: "analytics" as const },
    { href: paths.seller.reports, label: "گزارش فروش", group: "فروش", icon: "analytics" as const },
    { href: paths.seller.products, label: "محصولات", primary: true, group: "فروش", icon: "products" as const },
    { href: paths.seller.orders, label: "سفارش‌ها", primary: true, group: "فروش", icon: "orders" as const },
    { href: paths.seller.discounts, label: "تخفیف‌ها", group: "فروش", icon: "discounts" as const },
    { href: paths.seller.conversations, label: "گفتگوها", primary: true, group: "ارتباط", icon: "chat" as const },
    { href: paths.seller.customers, label: "مشتری‌ها", primary: true, group: "ارتباط", icon: "users" as const },
    { href: paths.seller.store, label: "تنظیمات فروشگاه", group: "مدیریت", icon: "store" as const },
    { href: paths.seller.changePassword, label: "رمز عبور", group: "مدیریت", icon: "settings" as const },
    { href: paths.seller.paymentMethods, label: "پرداخت‌ها", group: "مدیریت", icon: "payments" as const },
    { href: paths.seller.subscription, label: "اشتراک", group: "مدیریت", icon: "subscription" as const },
    { href: paths.seller.team, label: "تیم", group: "مدیریت", icon: "users" as const },
    { href: paths.seller.domain, label: "دامنه اختصاصی", group: "مدیریت", icon: "store" as const },
  ];
  const navItems = allNavItems.filter((item) => {
    const area = areaForPath(item.href);
    return area === null || can(area);
  });

  return (
      <WorkspaceShell
        variant="tabs"
        brandLabel="Nisha"
        roleLabel="مرکز فروشنده"
        title="مدیریت فروشگاه"
        userName={user?.full_name ?? null}
        userMeta={user?.email ?? user?.store_slug ?? null}
        identityName={activeStore?.name ?? store?.name ?? user?.store_slug ?? null}
        identityImageUrl={store?.logo_url ? resolveMediaUrl(store.logo_url) : null}
        identityHref={activeStore?.slug ?? store?.slug ? paths.store((activeStore?.slug ?? store?.slug) as string) : null}
        identityOpenInNewTab
        navItems={navItems}
        onLogout={logout}
        topActions={
          <div className="flex flex-wrap items-center gap-2">
            <ThemeSwitcher variant="design" />
            <StoreSwitcher />
            {(activeStore?.slug ?? user?.store_slug) ? (
              <Link
                href={paths.store((activeStore?.slug ?? user?.store_slug) as string)}
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
        {store && !store.is_published ? (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            <p className="font-medium">فروشگاه هنوز پیش‌نویس است</p>
            <p className="mt-1 text-foreground-muted">
              مشتری‌ها صفحه‌ت رو نمی‌بینن. وقتی آماده بودی، از تنظیمات فروشگاه «انتشار» رو روشن کن.{" "}
              <Link href={paths.seller.store} className="text-brand underline-offset-2 hover:underline">
                برو به تنظیمات
              </Link>
            </p>
          </div>
        ) : null}
        {!isReady ? <LoadingState /> : forbidden ? <RoleForbidden /> : children}
      </WorkspaceShell>
  );
}
