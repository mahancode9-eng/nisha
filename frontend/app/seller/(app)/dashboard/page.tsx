"use client";

import Link from "next/link";
import * as dashboardApi from "@/lib/api/seller/dashboard";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/seller/PageHeader";
import { StatCard } from "@/components/seller/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  const { data, error, isLoading } = useSellerFetch(() => dashboardApi.getDashboard(), []);
  const { data: store } = useSellerFetch(() => storeApi.getStore(), []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="داشبورد" description="نمای کلی عملکرد فروشگاه شما" />
        <StatCardSkeleton count={6} />
        <TableSkeleton rows={3} columns={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="داشبورد" description="نمای کلی عملکرد فروشگاه شما" />
        <ErrorAlert message={error ?? "بارگذاری داشبورد ممکن نشد"} />
      </div>
    );
  }

  const hasRemainingSetup = data.onboarding_status !== "COMPLETED";
  const readinessPercent = Math.max(0, Math.min(100, data.store_readiness_score));
  const onboardingStatusLabel =
    data.onboarding_status === "COMPLETED"
      ? "کامل"
      : data.onboarding_status === "SKIPPED"
        ? "ذخیره شده"
        : data.onboarding_status === "IN_PROGRESS"
          ? "در حال انجام"
          : "شروع نشده";
  const onboardingStepLabel =
    data.onboarding_current_step === "store_identity"
      ? "هویت فروشگاه"
      : data.onboarding_current_step === "store_information"
        ? "اطلاعات فروشگاه"
        : data.onboarding_current_step === "contact_channels"
          ? "راه‌های ارتباطی"
          : data.onboarding_current_step === "first_product"
            ? "اولین محصول"
            : data.onboarding_current_step === "education"
              ? "آموزش"
              : data.onboarding_current_step === "activation"
                ? "فعال‌سازی"
                : "خوش‌آمد";

  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبورد"
        description="نمای کلی عملکرد فروشگاه شما"
        action={
          store?.slug ? (
            <Link href={paths.store(store.slug)} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">مشاهده فروشگاه</Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="overflow-hidden border-brand/20 bg-gradient-to-br from-brand/10 via-surface to-surface shadow-sm">
        <CardContent className="grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={readinessPercent >= 85 ? "success" : "info"}>
                {readinessPercent}% تکمیل پروفایل
              </Badge>
              {hasRemainingSetup ? (
                <Badge variant="warning">راه‌اندازی در حال انجام</Badge>
              ) : (
                <Badge variant="success">راه‌اندازی کامل</Badge>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">ادامه تنظیمات فروشگاه</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
                این کارت خلاصه‌ای از وضعیت شروع کار شما را نشان می‌دهد. هرچه جزئیات بیشتری تکمیل کنید،
                اعتماد مشتری و شانس تبدیل بالاتر می‌رود.
              </p>
            </div>

            {data.store_readiness_missing_tasks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.store_readiness_missing_tasks.map((task) => (
                  <Badge key={task} variant="neutral">
                    {task}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">همه مراحل اصلی تکمیل شده‌اند.</p>
            )}
          </div>

          <div className="space-y-3 rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">پیشرفت راه‌اندازی</span>
              <span className="font-semibold text-foreground">{readinessPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
            <div className="space-y-2 text-sm text-foreground-muted">
              <p>وضعیت مراحل: {onboardingStatusLabel}</p>
              <p>آخرین مرحله: {onboardingStepLabel}</p>
            </div>
            {hasRemainingSetup && (
              <Link href={paths.seller.onboarding} className="block">
                <Button className="w-full">ادامه راه‌اندازی</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="کل سفارش‌ها" value={data.total_orders} />
        <StatCard label="سفارش‌های در انتظار" value={data.pending_orders} />
        <StatCard label="درآمد تاییدشده" value={formatMoney(data.confirmed_revenue)} />
        <StatCard label="درآمد در انتظار" value={formatMoney(data.pending_revenue)} />
        <StatCard label="درآمد امروز" value={formatMoney(data.today_revenue)} />
        <StatCard label="پرداخت بارگذاری‌شده" value={data.payment_uploaded_orders} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>محصولات کم‌موجودی</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.low_stock_products.length === 0 ? (
              <EmptyState title="مورد کم‌موجودی ندارید" description="همه محصولات موجودی کافی دارند." />
            ) : (
              <Table>
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
          <CardContent className="pt-0">
            {data.recent_orders.length === 0 ? (
              <EmptyState title="هنوز سفارشی ثبت نشده" description="سفارش‌ها اینجا نمایش داده می‌شوند." />
            ) : (
              <Table>
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
                      <TableCell>{order.buyer_name}</TableCell>
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
