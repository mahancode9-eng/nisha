"use client";

import { useCallback, useState } from "react";
import * as analyticsApi from "@/lib/api/seller/analytics";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

const RANGE_OPTIONS = [
  { days: 7, label: "۷ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
];

function formatNumber(value: number | string): string {
  return Number(value).toLocaleString("fa-IR");
}

type ChartPoint = { label: string; value: number };

function BarChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="flex h-40 gap-px" dir="ltr">
      {points.map((point) => {
        const pct = Math.max(2, Math.round((point.value / max) * 100));
        const barStyle = { height: pct + "%" };
        return (
          <div key={point.label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-brand/60 transition-colors group-hover:bg-brand"
              style={barStyle}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded border border-border bg-surface-muted px-2 py-1 text-xs text-foreground group-hover:block">
              {point.label}: {formatNumber(point.value)} {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SellerAnalyticsPage() {
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(() => analyticsApi.getAnalytics(days), [days]);
  const { data, error, isLoading } = useSellerFetch(fetchAnalytics, [days]);

  const totals = data?.totals;
  const daily = data?.daily ?? [];

  const visitPoints = daily.map((point) => ({ label: point.date, value: point.visits }));
  const revenuePoints = daily.map((point) => ({
    label: point.date,
    value: Number(point.revenue),
  }));
  const orderPoints = daily.map((point) => ({ label: point.date, value: point.orders }));

  return (
    <div className="space-y-6">
      <PageHeader
        description="فروش روزانه، بازدید ویترین، نرخ تبدیل و محصولات پرفروش"
        action={
          <div className="flex gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.days}
                size="sm"
                variant={days === option.days ? undefined : "secondary"}
                onClick={() => setDays(option.days)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      />

      {isLoading && <TableSkeleton rows={4} columns={4} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent>
                <div className="text-sm text-foreground-muted">سفارش‌ها</div>
                <div className="mt-1 text-2xl font-bold">{formatNumber(totals?.orders ?? 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-sm text-foreground-muted">درآمد تاییدشده (تومان)</div>
                <div className="mt-1 text-2xl font-bold">{formatNumber(totals?.revenue ?? 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-sm text-foreground-muted">بازدید ویترین</div>
                <div className="mt-1 text-2xl font-bold">{formatNumber(totals?.visits ?? 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-sm text-foreground-muted">نرخ تبدیل</div>
                <div className="mt-1 text-2xl font-bold">
                  {formatNumber(totals?.conversion_rate ?? 0)}٪
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="mb-4 font-semibold">درآمد روزانه</h3>
                <BarChart points={revenuePoints} unit="تومان" />
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="mb-4 font-semibold">بازدید روزانه</h3>
                <BarChart points={visitPoints} unit="بازدید" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent>
              <h3 className="mb-4 font-semibold">سفارش‌های روزانه</h3>
              <BarChart points={orderPoints} unit="سفارش" />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="mb-4 font-semibold">محصولات پرفروش</h3>
              {data.top_products.length === 0 ? (
                <EmptyState
                  title="هنوز فروشی ثبت نشده"
                  description="با ثبت اولین سفارش، محصولات پرفروش اینجا نمایش داده می‌شوند."
                />
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>محصول</TableHeaderCell>
                      <TableHeaderCell>تعداد فروش</TableHeaderCell>
                      <TableHeaderCell>درآمد (تومان)</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.top_products.map((product) => (
                      <TableRow key={(product.product_id ?? 0) + "-" + product.title}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{formatNumber(product.quantity)}</TableCell>
                        <TableCell>{formatNumber(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
