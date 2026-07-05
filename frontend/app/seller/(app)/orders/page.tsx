"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ordersApi from "@/lib/api/seller/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Tabs } from "@/components/ui/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { OrderStatus } from "@/types/order";

const PAYMENT_CONFIRMATION_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_UPLOADED",
  "PAYMENT_REJECTED",
];

const ORDER_PROCESSING_STATUSES: OrderStatus[] = [
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

type TabKey = "payment" | "processing";

export default function SellerOrdersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("payment");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab]);

  const fetchOrders = useCallback(
    () =>
      ordersApi.listOrders({
        search: debouncedSearch || undefined,
        page,
        page_size: 20,
      }),
    [debouncedSearch, page],
  );

  const { data, error, isLoading } = useSellerFetch(fetchOrders, [debouncedSearch, page]);
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const paymentOrders = useMemo(
    () => items.filter((order) => PAYMENT_CONFIRMATION_STATUSES.includes(order.status)),
    [items],
  );
  const processingOrders = useMemo(
    () => items.filter((order) => ORDER_PROCESSING_STATUSES.includes(order.status)),
    [items],
  );

  const visibleItems = activeTab === "payment" ? paymentOrders : processingOrders;

  return (
    <div className="space-y-6">
      <PageHeader description="بین بررسی پرداخت و پردازش سفارش تقسیم شده است" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="جستجو"
            placeholder="فاکتور، نام خریدار یا تلفن"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        items={[
          { key: "payment", label: `تأیید پرداخت (${paymentOrders.length})` },
          { key: "processing", label: `پردازش سفارش (${processingOrders.length})` },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      >
        {isLoading && <TableSkeleton rows={6} columns={5} />}

        <ErrorAlert message={!isLoading && error ? error : ""} />

        {!isLoading && !error && data && data.total === 0 && (
          <EmptyState title="سفارشی پیدا نشد" description="جستجوی خود را تغییر دهید." />
        )}

        {!isLoading && visibleItems.length === 0 && data && data.total > 0 && (
          <EmptyState
            title="در این بخش سفارشی نیست"
            description="در این صفحه سفارش منطبق با این تب وجود ندارد."
          />
        )}

        {!isLoading && visibleItems.length > 0 && (
          <>
            <Table>
              <TableHead>
              <TableRow>
                  <TableHeaderCell>فاکتور</TableHeaderCell>
                  <TableHeaderCell>تلفن</TableHeaderCell>
                  <TableHeaderCell>مجموع</TableHeaderCell>
                  <TableHeaderCell>وضعیت</TableHeaderCell>
                  <TableHeaderCell>ایجاد شده</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleItems.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={paths.seller.orderDetail(order.id)}
                      className="font-medium text-brand hover:underline"
                    >
                      {order.invoice_code}
                    </Link>
                    </TableCell>
                    <TableCell>{order.buyer_phone}</TableCell>
                    <TableCell>{formatMoney(order.total_amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
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
      </Tabs>
    </div>
  );
}
