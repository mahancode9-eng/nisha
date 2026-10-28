"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as customersApi from "@/lib/api/seller/customers";
import * as exportsApi from "@/lib/api/seller/exports";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import type { SellerCustomerListItem } from "@/types/seller/customer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

type ListResult =
  | { locked: true }
  | { locked: false; page: Awaited<ReturnType<typeof customersApi.listCustomers>> };

function TagEditor({
  customer,
  onClose,
  onSaved,
}: {
  customer: SellerCustomerListItem | null;
  onClose: () => void;
  onSaved: (key: string, tags: string[]) => void;
}) {
  const toast = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  if (customer && customer.key !== lastKey) {
    setLastKey(customer.key);
    setValue(customer.tags.join("، "));
  }

  async function save() {
    if (!customer) return;
    const tags = Array.from(
      new Set(
        value
          .split(/[,،\n]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
    setSaving(true);
    try {
      const res = await customersApi.setCustomerTags(customer.key, tags);
      onSaved(customer.key, res.tags);
      toast.success("برچسب‌ها ذخیره شد");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "برچسب‌ها ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={customer !== null} onClose={onClose} title="برچسب‌های مشتری">
      <div className="space-y-3">
        <p className="text-sm text-foreground-muted">
          {customer?.full_name} — برچسب‌ها رو با ویرگول جدا کن (تا ۱۰ تا).
        </p>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="مثلا: VIP، عمده"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            انصراف
          </Button>
          <Button type="button" loading={saving} onClick={() => void save()}>
            ذخیره
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function SellerCustomersPage() {
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canTags = entitlements.customer_tags;
  const canExport = entitlements.customer_export;
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [tag, setTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [editing, setEditing] = useState<SellerCustomerListItem | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tagOverrides, setTagOverrides] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, repeatOnly, tag]);

  useEffect(() => {
    if (!canTags) return;
    customersApi
      .listCustomerTags()
      .then(setAllTags)
      .catch(() => setAllTags([]));
  }, [canTags, tagOverrides]);

  const fetchCustomers = useCallback(async (): Promise<ListResult> => {
    try {
      const result = await customersApi.listCustomers({
        search: debouncedSearch || undefined,
        repeat_only: repeatOnly || undefined,
        tag: tag || undefined,
        page,
        page_size: 20,
      });
      return { locked: false, page: result };
    } catch (err) {
      if (err instanceof ApiError && err.upgradeRequired) return { locked: true };
      throw err;
    }
  }, [debouncedSearch, repeatOnly, tag, page]);

  const { data: result, error, isLoading } = useSellerFetch(fetchCustomers, [
    debouncedSearch,
    repeatOnly,
    tag,
    page,
  ]);
  const data = result && !result.locked ? result.page : null;
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  async function handleExport() {
    setExporting(true);
    try {
      await exportsApi.downloadCsv(() => exportsApi.exportCustomersCsv(), "customers.csv");
      toast.success("فایل اکسل مشتری‌ها دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فایل خروجی ساخته نشد. دوباره امتحان کن.");
    } finally {
      setExporting(false);
    }
  }

  if (result?.locked) {
    return (
      <div className="space-y-4 md:space-y-6">
        <PageHeader description="کسایی که از فروشگاهت خرید کردن یا پیام دادن" />
        <UpgradeGate
          title="لیست مشتری‌ها تو پلن پایه فعاله"
          description="با پلن پایه یا بالاتر، مشتری‌ها، مجموع خریدشون و خریدارهای تکراری رو می‌بینی."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        description="کسایی که از فروشگاهت خرید کردن یا پیام دادن"
        action={
          canExport ? (
            <Button type="button" variant="secondary" loading={exporting} onClick={() => void handleExport()}>
              خروجی اکسل مشتری‌ها
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجو با نام، موبایل یا ایمیل…"
          />
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={repeatOnly}
            onChange={(event) => setRepeatOnly(event.target.checked)}
            className="rounded border-border"
          />
          فقط خریدارهای تکراری
        </label>
        {canTags && allTags.length > 0 ? (
          <div className="w-full sm:w-48">
            <Select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="فیلتر برچسب">
              <option value="">همه برچسب‌ها</option>
              {allTags.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {!canTags || !canExport ? (
        <UpgradeGate
          compact
          title="برچسب و خروجی مشتری‌ها تو پلن حرفه‌ای فعاله"
          description="مشتری‌ها رو برچسب بزن، فیلتر کن و فایل اکسلشون رو بگیر."
        />
      ) : null}

      {error ? <ErrorAlert message={error} /> : null}

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
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
                <TableHeaderCell>سفارش‌های پرداخت‌شده</TableHeaderCell>
                <TableHeaderCell>مجموع خرید</TableHeaderCell>
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
                      {customer.is_repeat ? <Badge variant="info">خریدار تکراری</Badge> : null}
                    </div>
                    {canTags ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {(tagOverrides[customer.key] ?? customer.tags).map((name) => (
                          <span
                            key={name}
                            className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-foreground-muted"
                          >
                            {name}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEditing(customer)}
                          className="text-xs text-brand hover:underline"
                        >
                          ویرایش برچسب
                        </button>
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell>{formatNumber(customer.paid_order_count)}</TableCell>
                  <TableCell>{formatMoney(customer.total_spent)}</TableCell>
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

      <TagEditor
        customer={editing && { ...editing, tags: tagOverrides[editing.key] ?? editing.tags }}
        onClose={() => setEditing(null)}
        onSaved={(key, tags) => setTagOverrides((prev) => ({ ...prev, [key]: tags }))}
      />
    </div>
  );
}
