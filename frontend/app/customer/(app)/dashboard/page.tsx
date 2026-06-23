"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { paths } from "@/lib/auth/paths";
import { getDashboard } from "@/lib/api/customer/orders";
import type { CustomerDashboardSummary } from "@/types/customer/order";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [data, setData] = useState<CustomerDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const summary = await getDashboard();
        if (!cancelled) setData(summary);
      } catch {
        if (!cancelled) setError("بارگذاری داشبورد ممکن نشد.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <EmptyState title="داشبورد در دسترس نیست" description={error} />;
  }

  if (!data) {
    return <LoadingState message="در حال بارگذاری داشبورد..." />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Stat label="سفارش‌ها" value={data.total_orders} />
        <Stat label="فعال" value={data.active_orders} />
        <Stat label="اعتراض‌ها" value={data.complaints} />
        <Stat label="دانلودها" value={data.downloads} />
        <Stat label="گفتگوها" value={data.chats} />
        <Stat label="نظرات" value={data.reviews} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>سفارش‌های اخیر</CardTitle>
            <Link href={paths.customer.orders} className="text-sm text-brand hover:underline">
              مشاهده همه
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recent_orders.length === 0 ? (
              <EmptyState
                title="هنوز سفارشی ثبت نشده"
                description="تاریخچه سفارش شما پس از پرداخت یا ثبت فاکتور قدیمی اینجا نمایش داده می‌شود."
              />
            ) : (
              data.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={paths.customer.orderDetail(order.id)} className="font-medium text-foreground hover:underline">
                        {order.invoice_code}
                      </Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">{order.buyer_name}</p>
                    <p className="text-xs text-foreground-muted">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="text-sm text-foreground">
                    <p>{formatMoney(order.total_amount)}</p>
                    <p className="text-xs text-foreground-muted">
                      رسید: {order.receipt_status ?? "ثبت‌نشده"} | اعتراض‌ها: {order.complaint_count}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>پروفایل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground">
              <p className="font-medium text-foreground">{data.profile.full_name}</p>
              <p>{data.profile.email ?? data.profile.phone}</p>
              <p>کد پستی: {data.profile.postal_code ?? "ثبت نشده"}</p>
              <Link href={paths.customer.profile} className="inline-block text-brand hover:underline">
                ویرایش پروفایل
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آدرس‌های ذخیره‌شده</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.addresses.length === 0 ? (
                <p className="text-foreground-muted">هنوز آدرس ذخیره‌شده‌ای ندارید.</p>
              ) : (
                data.addresses.slice(0, 3).map((address) => (
                  <div key={address.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium text-neutral-900">
                      {address.label ?? "آدرس"} {address.is_default && "(پیش‌فرض)"}
                    </p>
                    <p className="text-foreground-muted">{address.recipient_name}</p>
                    <p className="text-foreground-muted">{address.address_line1}</p>
                  </div>
                ))
              )}
              <Link href={paths.customer.addresses} className="inline-block text-brand hover:underline">
                مدیریت آدرس‌ها
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>پیام‌ها</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground">
              <p>{data.chats} رشته گفتگو با فروشندگان و پشتیبانی سفارش دارید.</p>
              <Link href={paths.customer.conversations} className="inline-block text-brand hover:underline">
                باز کردن صندوق پیام
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
