"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import * as ordersApi from "@/lib/api/admin/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PaginationControls } from "@/components/ui/PaginationControls";
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
import type { ListAdminOrdersParams } from "@/types/admin/order";
import type { OrderStatus } from "@/types/order";

const ORDER_STATUS_LABELS: Record<Exclude<OrderStatus, never>, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAYMENT_UPLOADED: "رسید پرداخت ثبت شد",
  PAYMENT_CONFIRMED: "پرداخت تایید شد",
  PAYMENT_REJECTED: "پرداخت رد شد",
  PREPARING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شد",
  DELIVERED: "تحویل شد",
  CANCELLED: "لغو شد",
};

const ORDER_STATUSES: ("" | OrderStatus)[] = [
  "",
  "PENDING_PAYMENT",
  "PAYMENT_UPLOADED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListAdminOrdersParams>({
    search: "",
    status: undefined,
    date_from: "",
    date_to: "",
    store_id: undefined,
  });
  const [draft, setDraft] = useState({
    search: "",
    status: "" as "" | OrderStatus,
    date_from: "",
    date_to: "",
    store_id: "",
  });

  const fetchOrders = useCallback(
    () =>
      ordersApi.listOrders({
        page,
        page_size: 20,
        search: filters.search || undefined,
        status: filters.status,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        store_id: filters.store_id,
      }),
    [filters, page],
  );

  const { data, error, isLoading } = useSellerFetch(fetchOrders, [filters, page]);

  const items = data?.items ?? [];

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({
      search: draft.search.trim() || undefined,
      status: draft.status || undefined,
      date_from: draft.date_from || undefined,
      date_to: draft.date_to || undefined,
      store_id: draft.store_id ? Number(draft.store_id) : undefined,
    });
  }

  function resetFilters() {
    setDraft({ search: "", status: "", date_from: "", date_to: "", store_id: "" });
    setFilters({});
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader description="تمام سفارش‌های پلتفرم را جستجو و مدیریت کنید" />

      <Card>
        <CardContent>
      <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          label="جستجو"
          value={draft.search}
          onChange={(e) => setDraft((current) => ({ ...current, search: e.target.value }))}
          placeholder="فاکتور، خریدار، فروشگاه، ایمیل"
        />
        <label className="space-y-1.5 text-sm">
          <span className="block font-medium text-foreground">وضعیت</span>
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft((current) => ({ ...current, status: e.target.value as "" | OrderStatus }))
            }
            className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status || "all"} value={status}>
                {status ? ORDER_STATUS_LABELS[status] : "همه وضعیت‌ها"}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="شناسه فروشگاه"
          type="number"
          value={draft.store_id}
          onChange={(e) => setDraft((current) => ({ ...current, store_id: e.target.value }))}
          placeholder="اختیاری"
        />
        <Input
          label="از"
          type="date"
          value={draft.date_from}
          onChange={(e) => setDraft((current) => ({ ...current, date_from: e.target.value }))}
        />
        <Input
          label="تا"
          type="date"
          value={draft.date_to}
          onChange={(e) => setDraft((current) => ({ ...current, date_to: e.target.value }))}
        />
        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-5">
          <Button type="submit">اعمال فیلترها</Button>
          <Button type="button" variant="secondary" onClick={resetFilters}>
            بازنشانی
          </Button>
        </div>
      </form>
        </CardContent>
      </Card>

      {isLoading && <TableSkeleton rows={6} columns={7} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState title="سفارشی وجود ندارد" description="وقتی مشتری‌ها پرداخت کنند، سفارش‌ها اینجا نمایش داده می‌شوند." />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>فاکتور</TableHeaderCell>
                <TableHeaderCell>فروشگاه</TableHeaderCell>
                <TableHeaderCell>خریدار</TableHeaderCell>
                <TableHeaderCell>تماس</TableHeaderCell>
                <TableHeaderCell>مجموع</TableHeaderCell>
                <TableHeaderCell>وضعیت</TableHeaderCell>
                <TableHeaderCell>نشانه‌ها</TableHeaderCell>
                <TableHeaderCell>ایجاد شده</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={paths.admin.orderDetail(order.id)}
                      className="font-medium text-brand hover:underline"
                    >
                      {order.invoice_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={paths.store(order.store_slug)}
                      className="text-sm hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {order.store_name}
                    </Link>
                  </TableCell>
                  <TableCell>{order.buyer_name}</TableCell>
                  <TableCell>{order.buyer_phone}</TableCell>
                  <TableCell>{formatMoney(order.total_amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={order.receipt_status === "RECEIVED" ? "success" : "neutral"}>
                        {order.receipt_status ?? "بدون رسید"}
                      </Badge>
                      {order.complaint_count > 0 && <Badge variant="warning">{order.complaint_count} اعتراض</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(order.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && (
            <PaginationControls
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
