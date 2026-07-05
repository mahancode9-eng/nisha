"use client";

import Link from "next/link";
import * as dashboardApi from "@/lib/api/seller/dashboard";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
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
        <PageHeader description="نمای کلی عملکرد فروشگاه شما" />
        <StatCardSkeleton count={6} />
        <TableSkeleton rows={3} columns={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader description="نمای کلی عملکرد فروشگاه شما" />
        <ErrorAlert message={error ?? "بارگذاری داشبورد ممکن نشد"} />
      </div>
    );
  }

  const hasRemainingSetup =
    data.onboarding_status !== "COMPLETED" && data.onboarding_status !== "SKIPPED";
  const readinessPercent = Math.max(0, Math.min(100, data.store_readiness_score));

  return (
    <div className="space-y-6">
      <PageHeader
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
        <CardContent className="space-y-5 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={readinessPercent >= 85 ? "success" : "info"}>
              {readinessPercent}% تکمیل پروفایل
            </Badge>
            {hasRemainingSetup ? (
              <Badge variant="warning">راه‌اندازی در حال انجام</Badge>
            ) : data.onboarding_status === "SKIPPED" ? (
              <Badge variant="neutral">راه‌اندازی بعداً</Badge>
            ) : (
              <Badge variant="success">راه‌اندازی کامل</Badge>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                {hasRemainingSetup ? "ادامه تنظیمات فروشگاه" : "وضعیت فروشگاه"}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-foreground-muted">
                {hasRemainingSetup
                  ? "هرچه جزئیات بیشتری تکمیل کنید، اعتماد مشتری و شانس تبدیل بالاتر می‌رود."
                  : "فروشگاه شما فعال است. از تب‌های بالا سفارش‌ها، محصولات و گفتگوها را مدیریت کنید."}
              </p>
              {data.store_readiness_missing_tasks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.store_readiness_missing_tasks.map((task) => (
                    <Badge key={task} variant="neutral">
                      {task}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">پیشرفت</span>
                <span className="font-semibold text-foreground">{readinessPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500"
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
              {hasRemainingSetup && (
                <Link href={paths.seller.onboarding} className="block">
                  <Button className="w-full">ادامه راه‌اندازی</Button>
                </Link>
              )}
            </div>
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
          <CardContent>
            {data.low_stock_products.length === 0 ? (
              <EmptyState title="مورد کم‌موجودی ندارید" description="همه محصولات موجودی کافی دارند." />
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
              <EmptyState title="هنوز سفارشی ثبت نشده" description="سفارش‌ها اینجا نمایش داده می‌شوند." />
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
