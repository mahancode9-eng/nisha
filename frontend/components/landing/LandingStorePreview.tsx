"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as dashboardApi from "@/lib/api/seller/dashboard";
import * as storeApi from "@/lib/api/seller/store";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { LandingMockup } from "@/components/landing/LandingMockup";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import type { SellerDashboardResponse } from "@/types/seller/dashboard";
import type { Store } from "@/types/seller/store";

type LandingStorePreviewProps = {
  className?: string;
};

function GuestEngagementPanel({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <LandingMockup />
      <div className="rounded-[1.5rem] border border-border/70 bg-surface/90 p-4 text-center shadow-sm">
        <p className="text-sm font-semibold text-foreground">فروشگاه خود را در چند دقیقه بسازید</p>
        <p className="mt-1 text-sm text-foreground-muted">
          ثبت‌نام رایگان، ویترین اختصاصی، دریافت سفارش و فاکتور — بدون نیاز به کدنویسی.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href={paths.seller.register} className={landingButtonClasses({ size: "md" })}>
            ساخت فروشگاه رایگان
          </Link>
          <Link
            href={paths.seller.login}
            className={landingButtonClasses({ variant: "secondary", size: "md" })}
          >
            ورود فروشنده
          </Link>
        </div>
      </div>
    </div>
  );
}

function SellerLivePreview({
  store,
  dashboard,
  className,
}: {
  store: Store;
  dashboard: SellerDashboardResponse;
  className?: string;
}) {
  const logoUrl = store.logo_url ? resolveMediaUrl(store.logo_url) : null;
  const onboardingComplete =
    dashboard.onboarding_status === "COMPLETED" || dashboard.onboarding_status === "SKIPPED";
  const statusLabel = !store.is_active
    ? "غیرفعال"
    : onboardingComplete
      ? "فعال"
      : "در حال راه‌اندازی";
  const statusClass = !store.is_active
    ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
    : onboardingComplete
      ? "border-brand/20 bg-brand/10 text-brand"
      : "border-sky-500/30 bg-sky-500/10 text-sky-700";

  const checklist =
    dashboard.store_readiness_missing_tasks.length > 0
      ? dashboard.store_readiness_missing_tasks.map((task) => ({ label: task, done: false }))
      : [
          { label: "فروشگاه", done: true },
          { label: "اطلاعات تماس", done: true },
          { label: "اولین محصول", done: dashboard.store_readiness_score >= 80 },
        ];

  return (
    <div className={cn("relative mx-auto w-full max-w-[34rem]", className)}>
      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,243,255,0.82))] p-4 shadow-[0_24px_80px_rgba(31,41,55,0.12)] dark:bg-[linear-gradient(180deg,rgba(10,14,26,0.96),rgba(4,7,15,0.98))]">
        <div className="rounded-[1.6rem] border border-border/70 bg-surface/95 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-10 w-10 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold text-brand">
                  {store.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.22em] text-foreground-muted">فروشگاه شما</p>
                <p className="truncate text-sm font-semibold text-foreground">{store.name}</p>
              </div>
            </div>
            <div className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-medium", statusClass)}>
              {statusLabel}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">آمادگی فروشگاه</span>
                <span className="font-semibold text-foreground">{dashboard.store_readiness_score}٪</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-fuchsia-500"
                  style={{ width: `${Math.min(dashboard.store_readiness_score, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-2">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-border/60 px-3 py-2 text-sm"
                >
                  <span>{item.label}</span>
                  <span className={item.done ? "text-emerald-600" : "text-foreground-muted"}>
                    {item.done ? "تکمیل" : "باقی‌مانده"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {!onboardingComplete && (
                <Link href={paths.seller.onboarding}>
                  <Button size="sm">ادامه راه‌اندازی</Button>
                </Link>
              )}
              <Link href={paths.seller.dashboard}>
                <Button variant="secondary" size="sm">
                  داشبورد
                </Button>
              </Link>
              {store.slug && (
                <Link href={paths.store(store.slug)} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    مشاهده فروشگاه
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingStorePreview({ className }: LandingStorePreviewProps) {
  const { user, isLoading } = useAuth();
  const isSeller = !isLoading && user?.role === "SELLER";
  const [store, setStore] = useState<Store | null>(null);
  const [dashboard, setDashboard] = useState<SellerDashboardResponse | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    if (!isSeller) {
      setStore(null);
      setDashboard(null);
      return;
    }
    let cancelled = false;
    setLoadingLive(true);
    (async () => {
      try {
        const [storeData, dashboardData] = await Promise.all([
          storeApi.getStore(),
          dashboardApi.getDashboard(),
        ]);
        if (!cancelled) {
          setStore(storeData);
          setDashboard(dashboardData);
        }
      } catch {
        if (!cancelled) {
          setStore(null);
          setDashboard(null);
        }
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSeller]);

  if (isLoading || (isSeller && loadingLive)) {
    return (
      <div className={cn("mx-auto w-full max-w-[34rem]", className)}>
        <LoadingState message="در حال بارگذاری پیش‌نمایش..." />
      </div>
    );
  }

  if (isSeller && store && dashboard) {
    return <SellerLivePreview store={store} dashboard={dashboard} className={className} />;
  }

  if (isSeller) {
    return (
      <div className={cn("space-y-4", className)}>
        <GuestEngagementPanel />
        <Link href={paths.seller.onboarding} className={landingButtonClasses({ size: "md", className: "w-full justify-center" })}>
          شروع ساخت فروشگاه
        </Link>
      </div>
    );
  }

  return <GuestEngagementPanel className={className} />;
}
