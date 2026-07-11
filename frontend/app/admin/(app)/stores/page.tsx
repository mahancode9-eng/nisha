"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import * as storesApi from "@/lib/api/admin/stores";
import * as supportApi from "@/lib/api/admin/support";
import { paths } from "@/lib/auth/paths";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
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

type DraftFilters = {
  search: string;
};

export default function AdminStoresPage() {
  const toast = useToast();
  const router = useRouter();
  const { setSession } = useAuth();
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);
  const [filters, setFilters] = useState<DraftFilters>({ search: "" });
  const [draft, setDraft] = useState<DraftFilters>({ search: "" });

  const fetchStores = useCallback(
    () => storesApi.listStores({ page, page_size: 20, search: filters.search || undefined }),
    [filters, page],
  );

  const { data, error, isLoading, refetch } = useSellerFetch(fetchStores, [filters, page]);

  async function runAction(storeId: number, action: "approve" | "suspend" | "activate" | "deactivate") {
    setActionId(storeId);
    try {
      if (action === "approve") {
        await storesApi.approveStore(storeId);
        toast.success("فروشگاه تایید شد");
      } else if (action === "suspend") {
        await storesApi.suspendStore(storeId);
        toast.success("فروشگاه تعلیق شد");
      } else if (action === "activate") {
        await storesApi.activateStore(storeId);
        toast.success("فروشگاه فعال شد");
      } else {
        await storesApi.deactivateStore(storeId);
        toast.success("فروشگاه غیرفعال شد");
      }
      await refetch();
    } catch {
      toast.error("به‌روزرسانی فروشگاه ناموفق بود");
    } finally {
      setActionId(null);
    }
  }

  async function impersonate(storeId: number) {
    setActionId(storeId);
    try {
      const session = await supportApi.impersonateStore(storeId);
      setSession(session.access_token, session.user);
      toast.success("با حساب فروشنده وارد شدید");
      router.push(paths.seller.dashboard);
    } catch {
      toast.error("ورود به‌جای فروشنده ناموفق بود");
      setActionId(null);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({ search: draft.search.trim() });
  }

  function resetFilters() {
    setDraft({ search: "" });
    setFilters({ search: "" });
    setPage(1);
  }

  const items = data?.items ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        description="مدیریت فروشگاه‌های فروشنده، تاییدها و نشان‌های اعتماد"
        action={<Badge variant="info">{data?.total ?? 0} فروشگاه</Badge>}
      />

      <Card>
        <CardContent>
          <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <Input
                label="جستجوی فروشگاه"
                value={draft.search}
                onChange={(e) => setDraft({ search: e.target.value })}
                placeholder="نام فروشگاه، اسلاگ، ایمیل مالک"
              />
            </div>
            <Button type="submit">جستجو</Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>
              بازنشانی
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <TableSkeleton rows={6} columns={7} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState title="فروشگاهی وجود ندارد" description="فروشگاه‌ها پس از ثبت‌نام فروشندگان نمایش داده می‌شوند." />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>فروشگاه</TableHeaderCell>
                <TableHeaderCell>مالک</TableHeaderCell>
                <TableHeaderCell>محصولات</TableHeaderCell>
                <TableHeaderCell>سفارش‌ها</TableHeaderCell>
                <TableHeaderCell>وضعیت</TableHeaderCell>
                <TableHeaderCell>ایجاد شده</TableHeaderCell>
                <TableHeaderCell>اقدامات</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={paths.admin.storeDetail(store.id)}
                        className="font-medium text-brand hover:underline"
                      >
                        {store.name}
                      </Link>
                      <div className="text-xs text-foreground-muted">/{store.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{store.owner_email}</TableCell>
                  <TableCell>{store.product_count}</TableCell>
                  <TableCell>{store.order_count}</TableCell>
                  <TableCell>
                    <Badge variant={store.is_active ? "success" : "neutral"}>
                      {store.is_active ? "فعال" : "معلق"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(store.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionId === store.id}
                        onClick={() => runAction(store.id, store.is_active ? "suspend" : "approve")}
                      >
                        {store.is_active ? "تعلیق" : "تایید"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionId === store.id}
                        onClick={() => impersonate(store.id)}
                      >
                        ورود به‌جای فروشنده
                      </Button>
                      <Link
                        href={paths.admin.storeBadges(store.id)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
                      >
                        نشان‌ها
                      </Link>
                      <Link
                        href={paths.admin.storeDetail(store.id)}
                        className="rounded-lg border border-brand/20 px-3 py-1.5 text-sm text-brand hover:bg-brand/5"
                      >
                        جزئیات
                      </Link>
                    </div>
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
    </div>
  );
}
