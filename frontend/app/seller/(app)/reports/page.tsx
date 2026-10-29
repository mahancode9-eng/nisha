"use client";

import { useCallback, useState } from "react";
import * as reportsApi from "@/lib/api/seller/reports";
import { formatMoney } from "@/lib/format";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
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

function formatNumber(value: number): string {
  return value.toLocaleString("fa-IR");
}

export default function SellerReportsPage() {
  const { entitlements, isLoading: entitlementsLoading } = useSellerEntitlements();
  const canReport = Boolean(entitlements.sales_report);
  const [days, setDays] = useState(30);

  const fetchReport = useCallback(
    () => (canReport ? reportsApi.getSalesReport(days) : Promise.resolve(null)),
    [canReport, days],
  );
  const { data, error, isLoading } = useSellerFetch(fetchReport, [canReport, days]);

  if (entitlementsLoading) {
    return <LoadingState message="داره گزارش رو آماده می‌کنه…" />;
  }

  if (!canReport) {
    return (
      <div className="page-stack">
        <PageHeader description="خلاصه فروش، سفارش دستی و خریدارهای تکراری" />
        <UpgradeGate
          feature="sales_report"
          suggestedPlan="basic"
          description="گزارش فروش از پلن پایه به بالا فعاله."
        />
      </div>
    );
  }

  if (isLoading && !data) return <LoadingState message="داره گزارش رو آماده می‌کنه…" />;

  const totals = data?.totals;

  return (
    <div className="page-stack">
      <PageHeader
        description="خلاصه فروش، سفارش دستی و خریدارهای تکراری"
        action={
          <div className="flex flex-wrap gap-2">
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

      {error ? <ErrorAlert message={error} /> : null}

      {totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-foreground-muted">سفارش‌ها</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totals.orders)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-foreground-muted">فروش</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(totals.revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-foreground-muted">میانگین سفارش</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatMoney(totals.average_order_value)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-foreground-muted">سفارش دستی</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totals.manual_orders)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-foreground-muted">خریدار تکراری</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(totals.repeat_buyers)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>پرفروش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.top_products.length ? (
            <EmptyState
              title="هنوز فروشی تو این بازه نیست"
              description="وقتی سفارش بیاد، اینجا پرفروش‌هات رو می‌بینی."
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>محصول</TableHeaderCell>
                  <TableHeaderCell>تعداد</TableHeaderCell>
                  <TableHeaderCell>فروش</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.top_products.map((item) => (
                  <TableRow key={`${item.product_id ?? "x"}-${item.title}`}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{formatNumber(item.quantity)}</TableCell>
                    <TableCell>{formatMoney(item.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
