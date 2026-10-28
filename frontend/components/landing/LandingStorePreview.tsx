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
import type { SellerDashboardResponse } from "@/types/seller/dashboard";
import type { Store } from "@/types/seller/store";

type LandingStorePreviewProps = {
  className?: string;
};

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
    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
    : onboardingComplete
      ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
      : "border-sky-400/30 bg-sky-400/10 text-sky-200";

  const checklist =
    dashboard.store_readiness_missing_tasks.length > 0
      ? dashboard.store_readiness_missing_tasks.map((task) => ({ label: task, done: false }))
      : [
          { label: "فروشگاه", done: true },
          { label: "اطلاعات تماس", done: true },
          { label: "اولین محصول", done: dashboard.store_readiness_score >= 80 },
        ];

  const initial = store.name.trim().charAt(0) || "ن";

  return (
    <div className={cn("landing-glow-ring mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0f]", className)}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-md border border-white/10 bg-black/30 px-3">
          <span className="truncate text-[11px] text-zinc-400">
            {store.slug ? `${store.slug}.nishaapp.ir` : "store.nishaapp.ir"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">فروشگاهت</p>
              <p className="truncate text-sm font-semibold text-white">{store.name}</p>
            </div>
          </div>
          <div className={cn("shrink-0 rounded-md border px-3 py-1 text-xs font-medium", statusClass)}>
            {statusLabel}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-lg font-semibold text-white">{dashboard.total_orders}</p>
              <p className="text-[11px] text-zinc-500">کل سفارش‌ها</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="text-lg font-semibold text-white">{dashboard.pending_orders}</p>
              <p className="text-[11px] text-zinc-500">در انتظار</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <p className="truncate text-lg font-semibold text-white">{dashboard.today_revenue}</p>
              <p className="text-[11px] text-zinc-500">فروش امروز</p>
            </div>
          </div>

          <div className="space-y-2">
            {checklist.slice(0, 4).map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm"
              >
                <span className="text-zinc-300">{item.label}</span>
                <span className={item.done ? "text-emerald-400" : "text-zinc-500"}>
                  {item.done ? "انجام شد" : "باقی مانده"}
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
                  دیدن فروشگاه
                </Button>
              </Link>
            )}
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

  if (isLoading || !isSeller || loadingLive) {
    return <LandingMockup className={className} />;
  }

  if (store && dashboard) {
    return <SellerLivePreview store={store} dashboard={dashboard} className={className} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <LandingMockup />
      <Link
        href={paths.seller.onboarding}
        className={landingButtonClasses({ size: "md", className: "w-full justify-center" })}
      >
        بزن بریم فروشگاه بساز
      </Link>
    </div>
  );
}
