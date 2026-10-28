"use client";

import { useCallback, useState } from "react";
import * as reportsApi from "@/lib/api/seller/reports";
import { ApiError } from "@/lib/api/errors";
import { formatMoney, formatNumber } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/seller/StatCard";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
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
import type { SalesReport } from "@/types/seller/report";

type ReportResult = { locked: true } | { locked: false; report: SalesReport };

function changeLine(label: string, current: number, previous: number, format: (n: number) => string) {
  const base = `ماه قبل: ${format(previous)}`;
  if (previous <= 0) return `${label} ${base}`;
  const pct = Math.round(((current - previous) / previous) * 100);
  const trend = pct === 0 ? "بدون تغییر" : `${formatNumber(Math.abs(pct))}٪ ${pct > 0 ? "بیشتر" : "کمتر"}`;
  return `${label} ${base} (${trend})`;
}

export default function SellerReportsPage() {
  const [month, setMonth] = useState<string | undefined>(undefined);

  const fetchReport = useCallback(async (): Promise<ReportResult> => {
    try {
      return { locked: false, report: await reportsApi.getSalesReport(month) };
    } catch (err) {
      if (err instanceof ApiError && err.upgradeRequired) return { locked: true };
      throw err;
    }
  }, [month]);

  const { data, error, isLoading } = useSellerFetch(fetchReport, [month]);
  const report = data && !data.locked ? data.report : null;

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader description="فروش تاییدشده هر ماه شمسی و مقایسه با ماه قبل" />

      {data?.locked ? (
        <UpgradeGate
          title="گزارش فروش تو پلن پایه فعاله"
          description="با پلن پایه یا بالاتر، فروش، میانگین سفارش و پرفروش‌ترین محصول‌های هر ماه رو می‌بینی."
        />
      ) : null}

      {isLoading && !report ? <TableSkeleton rows={4} columns={4} /> : null}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {report ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={isLoading}
              onClick={() => setMonth(report.previous_month)}
            >
              ماه قبل
            </Button>
            <h2 className="text-lg font-semibold">{report.month_label}</h2>
            <Button
              size="sm"
              variant="secondary"
              disabled={isLoading || !report.next_month}
              onClick={() => report.next_month && setMonth(report.next_month)}
            >
              ماه بعد
            </Button>
          </div>

          {report.order_count === 0 && report.manual_order_count === 0 ? (
            <EmptyState
              title="این ماه فروشی نداشتی"
              description="بعد از تایید پرداخت سفارش‌ها، گزارش همین‌جا پر می‌شه."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                <StatCard label="کل فروش" value={formatMoney(report.total_sales)} />
                <StatCard label="تعداد سفارش" value={formatNumber(report.order_count)} />
                <StatCard label="میانگین هر سفارش" value={formatMoney(report.average_order_value)} />
                <StatCard
                  label="سفارش‌های دستی"
                  value={`${formatNumber(report.manual_order_count)} · ${formatMoney(report.manual_sales)}`}
                />
              </div>

              <div className="space-y-1 text-sm text-foreground-muted">
                <p>
                  {changeLine("فروش:", Number(report.total_sales), Number(report.previous.total_sales), formatMoney)}
                </p>
                <p>
                  {changeLine("تعداد سفارش:", report.order_count, report.previous.order_count, formatNumber)}
                </p>
              </div>

              <Card>
                <CardContent>
                  <h3 className="mb-4 font-semibold">محصولات پرفروش</h3>
                  {report.best_sellers.length === 0 ? (
                    <EmptyState title="هنوز محصولی فروش نرفته" description="" />
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>محصول</TableHeaderCell>
                          <TableHeaderCell>تعداد فروش</TableHeaderCell>
                          <TableHeaderCell>درآمد</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.best_sellers.slice(0, 10).map((product) => (
                          <TableRow key={(product.product_id ?? 0) + "-" + product.title}>
                            <TableCell>{product.title}</TableCell>
                            <TableCell>{formatNumber(product.quantity)}</TableCell>
                            <TableCell>{formatMoney(product.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
