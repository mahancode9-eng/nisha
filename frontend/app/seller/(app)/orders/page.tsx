"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ordersApi from "@/lib/api/seller/orders";
import * as exportsApi from "@/lib/api/seller/exports";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/errors";
import { downloadOrderInvoice } from "@/lib/orders/downloadInvoice";
import { useToast } from "@/contexts/ToastContext";
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
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canExport = entitlements.excel_export;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("payment");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

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

  async function handleDownload(orderId: number, invoiceCode: string) {
    setDownloadingId(orderId);
    try {
      await downloadOrderInvoice(() => ordersApi.downloadInvoice(orderId), invoiceCode);
      toast.success("فاکتور دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فاکتور دانلود نشد. دوباره امتحان کن.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportsApi.downloadCsv(() => exportsApi.exportOrdersCsv(), "orders.csv");
      toast.success("فایل اکسل سفارش‌ها دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فایل خروجی ساخته نشد. دوباره امتحان کن.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="اول پرداخت‌ها رو چک کن، بعد سفارش‌ها رو آماده و ارسال کن"
        action={
          canExport ? (
            <Button type="button" variant="secondary" loading={exporting} onClick={() => void handleExport()}>
              خروجی Excel
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="جستجو"
            placeholder="کد فاکتور، نام خریدار یا تلفن"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        items={[
          { key: "payment", label: `بررسی پرداخت (${paymentOrders.length})` },
          { key: "processing", label: `آماده‌سازی و ارسال (${processingOrders.length})` },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      >
        {isLoading && <TableSkeleton rows={6} columns={5} />}

        <ErrorAlert message={!isLoading && error ? error : ""} />

        {!isLoading && !error && data && data.total === 0 && (
          <EmptyState title="سفارشی پیدا نشد" description="عبارت دیگه‌ای جستجو کن." />
        )}

        {!isLoading && visibleItems.length === 0 && data && data.total > 0 && (
          <EmptyState
            title="فعلاً سفارشی تو این بخش نیست"
            description="سفارش‌های جدید که برسن، اینجا نشون داده می‌شن."
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
                  <TableHeaderCell>تاریخ ثبت</TableHeaderCell>
                  <TableHeaderCell>عملیات</TableHeaderCell>
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={downloadingId === order.id}
                        onClick={() => void handleDownload(order.id, order.invoice_code)}
                      >
                        فاکتور
                      </Button>
                    </TableCell>
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
