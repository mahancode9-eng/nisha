"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as customersApi from "@/lib/api/seller/customers";
import { paths } from "@/lib/auth/paths";
import { formatDateTime } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

export default function SellerCustomersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchCustomers = useCallback(
    () =>
      customersApi.listCustomers({
        search: debouncedSearch || undefined,
        page,
        page_size: 20,
      }),
    [debouncedSearch, page],
  );

  const { data, error, isLoading } = useSellerFetch(fetchCustomers, [debouncedSearch, page]);
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader description="کسایی که از فروشگاهت خرید کردن یا پیام دادن" />

      <div className="max-w-md">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جستجو با نام، موبایل یا ایمیل…"
        />
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : items.length === 0 ? (
        <EmptyState
          title="هنوز مشتری‌ای نداری"
          description="با اولین سفارش یا پیام، مشتری‌ها اینجا اضافه می‌شن."
        />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>نام</TableHeaderCell>
                <TableHeaderCell>موبایل</TableHeaderCell>
                <TableHeaderCell>ایمیل</TableHeaderCell>
                <TableHeaderCell>سفارش‌ها</TableHeaderCell>
                <TableHeaderCell>آخرین سفارش</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((customer) => (
                <TableRow key={customer.key}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={paths.seller.customerDetail(customer.key)}
                        className="font-medium text-brand hover:underline"
                      >
                        {customer.full_name}
                      </Link>
                      <Badge variant={customer.kind === "account" ? "success" : "neutral"}>
                        {customer.kind === "account" ? "حساب کاربری" : "مهمان"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell>{customer.order_count}</TableCell>
                  <TableCell>
                    {customer.last_order_at ? formatDateTime(customer.last_order_at) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data && data.total_pages > 1 ? (
            <PaginationControls
              page={page}
              totalPages={data.total_pages}
              total={data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
