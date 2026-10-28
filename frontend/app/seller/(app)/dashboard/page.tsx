"use client";

import Link from "next/link";
import { useState } from "react";
import * as dashboardApi from "@/lib/api/seller/dashboard";
import * as onboardingApi from "@/lib/api/seller/onboarding";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/seller/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SellerDashboardPage() {
  const { data, error, isLoading, setData } = useSellerFetch(() => dashboardApi.getDashboard(), []);
  const { data: store } = useSellerFetch(() => storeApi.getStore(), []);
  const { plan } = useSellerEntitlements();
  const toast = useToast();
  const [skipping, setSkipping] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <PageHeader description="وضعیت فروشگاهت در یک نگاه" />
        <StatCardSkeleton count={6} />
        <TableSkeleton rows={3} columns={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 md:space-y-6">
        <PageHeader description="وضعیت فروشگاهت در یک نگاه" />
        <ErrorAlert message={error ?? "داشبورد باز نشد. صفحه رو دوباره باز کن."} />
      </div>
    );
  }

  const readinessPercent = Math.max(0, Math.min(100, data.store_readiness_score));
  const showOnboardingCard =
    data.onboarding_status === "IN_PROGRESS" || data.onboarding_status === "NOT_STARTED";

  async function skipOnboarding() {
    setSkipping(true);
    try {
      await onboardingApi.updateOnboarding({ status: "SKIPPED" });
      setData((current) =>
        current ? { ...current, onboarding_status: "SKIPPED" } : current,
      );
      toast.success("باشه؛ هر وقت خواستی، از تنظیمات ادامه بده.");
    } catch {
      toast.error("انجام نشد. دوباره امتحان کن.");
    } finally {
      setSkipping(false);
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        description="سفارش‌ها و درآمد فروشگاهت، یک‌جا"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {plan && (
              <Link href={paths.seller.subscription}>
                <Badge variant="neutral">پلن فعلی: {plan.name_fa}</Badge>
              </Link>
            )}
            {store?.slug ? (
              <Link
                href={paths.store(store.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "secondary" })}
              >
                دیدن فروشگاه
              </Link>
            ) : null}
          </div>
        }
      />

      {showOnboardingCard && (
        <Card className="border-brand/20 bg-brand/5 shadow-sm">
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-foreground">راه‌اندازی فروشگاهت هنوز تموم نشده</p>
              <p className="text-xs text-foreground-muted">
                {readinessPercent}% تکمیل
                {data.store_readiness_missing_tasks.length > 0
                  ? ` · باقی‌مانده: ${data.store_readiness_missing_tasks.slice(0, 2).join("، ")}`
                  : ""}
              </p>
              <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href={paths.seller.onboarding} className={buttonClassName({ size: "sm" })}>
                ادامه
              </Link>
              <Button type="button" variant="ghost" size="sm" loading={skipping} onClick={() => void skipOnboarding()}>
                فعلاً نه
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="کل سفارش‌ها" value={data.total_orders} />
        <StatCard label="سفارش‌های در انتظار" value={data.pending_orders} />
        <StatCard label="درآمد تاییدشده" value={formatMoney(data.confirmed_revenue)} />
        <StatCard label="درآمد در انتظار" value={formatMoney(data.pending_revenue)} />
        <StatCard label="درآمد امروز" value={formatMoney(data.today_revenue)} />
        <StatCard label="رسیدهای منتظر بررسی" value={data.payment_uploaded_orders} />
      </div>

      {/* Recent orders has four columns; give it the wider track so totals are not clipped. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>محصولات کم‌موجودی</CardTitle>
          </CardHeader>
          <CardContent>
            {data.low_stock_products.length === 0 ? (
              <EmptyState title="موجودی همه محصول‌ها کافی است" description="وقتی موجودی محصولی کم بشه، اینجا خبر می‌دیم." />
            ) : (
              <Table embedded>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>محصول</TableHeaderCell>
                    <TableHeaderCell>موجودی</TableHeaderCell>
                    <TableHeaderCell>قیمت</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.low_stock_products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.title}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>{formatMoney(product.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سفارش‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_orders.length === 0 ? (
              <EmptyState title="هنوز سفارشی نداری" description="لینک فروشگاهت رو برای مشتری‌ها بفرست؛ سفارش‌ها اینجا می‌آن." />
            ) : (
              <Table embedded>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>فاکتور</TableHeaderCell>
                    <TableHeaderCell>خریدار</TableHeaderCell>
                    <TableHeaderCell>وضعیت</TableHeaderCell>
                    <TableHeaderCell>مجموع</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recent_orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={paths.seller.orderDetail(order.id)} className="font-medium text-brand hover:underline">
                          {order.invoice_code}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[9rem] truncate" title={order.buyer_name}>
                          {order.buyer_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{formatMoney(order.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
