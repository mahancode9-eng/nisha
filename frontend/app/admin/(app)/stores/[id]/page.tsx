"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import * as storesApi from "@/lib/api/admin/stores";
import { paths } from "@/lib/auth/paths";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { AdminStoreDetail } from "@/types/admin/store";

type PageProps = {
  params: Promise<{ id: string }>;
};

function BadgeList({ badges }: { badges: AdminStoreDetail["badges"] }) {
  if (badges.length === 0) {
    return <p className="text-sm text-foreground-muted">هیچ نشان اعتباری اختصاص داده نشده است.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={badge.badge_type} variant="info">
          {badge.badge_type}
        </Badge>
      ))}
    </div>
  );
}

export default function AdminStoreDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const storeId = parseInt(id, 10);
  const toast = useToast();
  const [actionBusy, setActionBusy] = useState(false);

  const { data, error, isLoading, refetch } = useSellerFetch(
    () => storesApi.getStoreDetail(storeId),
    [storeId],
  );

  useEffect(() => {
    if (error) {
      setActionBusy(false);
    }
  }, [error]);

  async function toggleStore(active: boolean) {
    setActionBusy(true);
    try {
      if (active) {
        await storesApi.approveStore(storeId);
        toast.success("فروشگاه تایید شد");
      } else {
        await storesApi.suspendStore(storeId);
        toast.success("فروشگاه تعلیق شد");
      }
      await refetch();
    } catch {
      toast.error("به‌روزرسانی فروشگاه ناموفق بود");
    } finally {
      setActionBusy(false);
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری فروشگاه..." />;

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error ?? "فروشگاه پیدا نشد"} />
        <Link href={paths.admin.stores} className="text-sm text-brand hover:underline">
          بازگشت به فروشگاه‌ها
        </Link>
      </div>
    );
  }

  const { store, owner_email, product_count, order_count, badges, badge_history, audit_logs } = data;
  const logoUrl = store.logo_url ? resolveMediaUrl(store.logo_url) : null;
  const coverUrl = store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm">
        <div className="relative h-44 bg-neutral-950">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="relative flex h-full flex-col justify-between gap-4 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">مدیریت فروشگاه</p>
                <h1 className="mt-1 text-3xl font-bold">{store.name}</h1>
              </div>
              <Badge variant={store.is_active ? "success" : "neutral"}>
                {store.is_active ? "فعال" : "تعلیق‌شده"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={store.is_active ? "secondary" : "primary"}
                onClick={() => toggleStore(!store.is_active)}
                loading={actionBusy}
              >
                {store.is_active ? "تعلیق فروشگاه" : "تایید فروشگاه"}
              </Button>
              <Link
                href={paths.admin.storeBadges(store.id)}
                className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                مدیریت نشان‌ها
              </Link>
              <Link
                href={paths.store(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                باز کردن فروشگاه عمومی
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">مالک</p>
            <p className="font-semibold text-foreground">{owner_email}</p>
            <p className="text-sm text-foreground-muted">شناسه فروشگاه #{store.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">کاتالوگ</p>
            <p className="text-2xl font-bold text-foreground">{product_count}</p>
            <p className="text-sm text-foreground-muted">محصولات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">سفارش‌ها</p>
            <p className="text-2xl font-bold text-foreground">{order_count}</p>
            <p className="text-sm text-foreground-muted">کل سفارش‌ها</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>پروفایل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-start gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={store.name} className="h-20 w-20 rounded-2xl border border-border object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-muted text-2xl font-semibold text-foreground-muted">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {badges.length > 0 ? (
                    badges.map((badge) => (
                  <Badge key={badge.badge_type} variant="info">
                        {badge.badge_type}
                      </Badge>
                    ))
                  ) : (
                    <Badge>بدون نشان</Badge>
                  )}
                </div>
                <p className="text-sm text-foreground-muted">{store.description ?? "توضیحی تنظیم نشده است."}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  <span className="text-foreground-muted">نامک:</span> {store.slug}
                </p>
                <p>
                  <span className="text-foreground-muted">موقعیت:</span> {store.location ?? "ثبت نشده"}
                </p>
                <p>
                  <span className="text-foreground-muted">تلفن:</span> {store.phone ?? "ثبت نشده"}
                </p>
                <p>
                  <span className="text-foreground-muted">پشتیبانی:</span> {store.support_contact ?? "ثبت نشده"}
                </p>
              </div>
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  <span className="text-foreground-muted">تلگرام:</span> {store.telegram ?? "ثبت نشده"}
                </p>
                <p>
                  <span className="text-foreground-muted">واتساپ:</span> {store.whatsapp ?? "ثبت نشده"}
                </p>
                <p>
                  <span className="text-foreground-muted">اینستاگرام:</span> {store.instagram ?? "ثبت نشده"}
                </p>
                <p>
                  <span className="text-foreground-muted">بله:</span> {store.bale ?? "ثبت نشده"}
                </p>
                <p>
                  <span className="text-foreground-muted">وب‌سایت:</span>{" "}
                  {store.website ? (
                    <a href={store.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      باز کردن سایت
                    </a>
                  ) : (
                    "ثبت نشده"
                  )}
                </p>
              </div>
            </div>

            {store.social_links.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">پیوندهای اجتماعی</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {store.social_links
                    .filter((link) => link.is_active)
                    .map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
                      >
                        {link.label}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>نشان‌های اعتماد</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <BadgeList badges={badges} />
              <div className="flex flex-wrap gap-2">
                {badge_history.slice(0, 6).map((entry) => (
                  <Badge key={entry.id} variant={entry.action === "ASSIGN" ? "success" : "neutral"}>
                    {entry.badge_type} {entry.action}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>اقدام‌های سریع</CardTitle>
          </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant={store.is_active ? "secondary" : "primary"}
                onClick={() => toggleStore(!store.is_active)}
                loading={actionBusy}
              >
                {store.is_active ? "تعلیق فروشگاه" : "تایید فروشگاه"}
              </Button>
                <Link
                  href={paths.admin.storeBadges(store.id)}
                  className="block w-full rounded-lg border border-brand/20 px-4 py-2 text-center text-sm font-medium text-brand hover:bg-brand/10"
                >
                مدیریت تخصیص نشان
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تاریخچه نشان‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {badge_history.length === 0 ? (
              <EmptyState title="تاریخچه‌ای نیست" description="تخصیص نشان‌ها اینجا نمایش داده می‌شود." />
            ) : (
              badge_history.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {entry.badge_type} · {entry.action}
                    </p>
                    <span className="text-xs text-foreground-muted">{formatDateTime(entry.created_at)}</span>
                  </div>
                  {entry.note && <p className="mt-2 text-sm text-foreground-muted">{entry.note}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>لاگ نظارتی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {audit_logs.length === 0 ? (
              <EmptyState title="لاگ نظارتی ندارد" description="اقدام‌های ادمین اینجا نمایش داده می‌شوند." />
            ) : (
              audit_logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{log.action}</p>
                    <span className="text-xs text-foreground-muted">{formatDateTime(log.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">{log.actor_name ?? "سیستم"}</p>
                  {log.note && <p className="mt-2 text-sm text-foreground">{log.note}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
