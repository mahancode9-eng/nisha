"use client";

import Link from "next/link";
import * as dashboardApi from "@/lib/api/admin/dashboard";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/seller/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const { data, error, isLoading } = useSellerFetch(() => dashboardApi.getDashboard(), []);

  return (
    <div className="space-y-6">
      <PageHeader description="آمار سراسری پلتفرم و فعالیت‌های اخیر" />

      {isLoading && (
        <>
          <StatCardSkeleton count={6} />
          <TableSkeleton rows={4} columns={5} />
        </>
      )}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="کل فروشگاه‌ها" value={data.total_stores} />
            <StatCard label="فروشگاه‌های فعال" value={data.active_stores} />
            <StatCard label="فروشگاه‌های غیرفعال" value={data.inactive_stores} />
            <StatCard label="کل فروشندگان" value={data.total_sellers} />
            <StatCard label="کل محصولات" value={data.total_products} />
            <StatCard label="کل سفارش‌ها" value={data.total_orders} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="درآمد تاییدشده" value={formatMoney(data.confirmed_revenue)} />
            <StatCard label="درآمد در انتظار" value={formatMoney(data.pending_revenue)} />
          </div>

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
                      <TableHeaderCell>فروشگاه</TableHeaderCell>
                      <TableHeaderCell>خریدار</TableHeaderCell>
                      <TableHeaderCell>وضعیت</TableHeaderCell>
                      <TableHeaderCell>مجموع</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recent_orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={paths.admin.orderDetail(o.id)}
                            className="font-medium text-brand hover:underline"
                          >
                            {o.invoice_code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={paths.store(o.store_slug)}
                            className="text-sm text-foreground-muted hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {o.store_name}
                          </Link>
                        </TableCell>
                        <TableCell>{o.buyer_name}</TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell>{formatMoney(o.total_amount)}</TableCell>
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
