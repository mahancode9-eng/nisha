"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import * as customersApi from "@/lib/api/seller/customers";
import * as tagsApi from "@/lib/api/seller/customer-tags";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

type PageProps = {
  params: Promise<{ key: string }>;
};

export default function SellerCustomerDetailPage({ params }: PageProps) {
  const { key: rawKey } = use(params);
  const key = decodeURIComponent(rawKey);
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canTags = Boolean(entitlements.customer_tags);

  const { data, error, isLoading, refetch } = useSellerFetch(
    () => customersApi.getCustomer(key),
    [key],
  );
  const { data: allTags, refetch: refetchTags } = useSellerFetch(
    canTags ? () => tagsApi.listCustomerTags() : async () => [],
    [canTags],
  );

  const [newTagName, setNewTagName] = useState("");
  const [tagBusy, setTagBusy] = useState(false);

  const selectedIds = useMemo(
    () => new Set((data?.tags ?? []).map((tag) => tag.id)),
    [data?.tags],
  );

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) {
      toast.error("اسم برچسب رو بنویس.");
      return;
    }
    setTagBusy(true);
    try {
      const created = await tagsApi.createCustomerTag({ name });
      const nextIds = [...selectedIds, created.id];
      await tagsApi.assignCustomerTags(key, nextIds);
      setNewTagName("");
      toast.success("برچسب اضافه شد");
      await Promise.all([refetch(), refetchTags()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "برچسب ساخته نشد. دوباره امتحان کن.");
    } finally {
      setTagBusy(false);
    }
  }

  async function toggleTag(tagId: number) {
    setTagBusy(true);
    try {
      const next = new Set(selectedIds);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      await tagsApi.assignCustomerTags(key, [...next]);
      toast.success("برچسب‌ها به‌روز شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "برچسب ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setTagBusy(false);
    }
  }

  if (isLoading) {
    return <LoadingState message="داره مشتری رو بارگذاری می‌کنه…" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error ?? "مشتری پیدا نشد"} />
        <Link href={paths.seller.customers}>
          <Button variant="secondary">برگرد به مشتری‌ها</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{data.full_name}</h1>
            <Badge variant={data.kind === "account" ? "success" : "neutral"}>
              {data.kind === "account" ? "حساب کاربری" : "خریدار مهمان"}
            </Badge>
          </div>
          <p className="text-sm text-foreground-muted">
            {data.order_count} سفارش
            {data.last_order_at ? ` · آخرین سفارش ${formatDateTime(data.last_order_at)}` : ""}
          </p>
          {data.tags && data.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map((tag) => (
                <Badge key={tag.id} variant="info">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.conversation_id ? (
            <Link href={paths.seller.conversationDetail(data.conversation_id)}>
              <Button variant="secondary">دیدن گفتگو</Button>
            </Link>
          ) : null}
          <Link href={paths.seller.customers}>
            <Button variant="ghost">بازگشت</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات تماس</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground-muted">موبایل</span>
              <span dir="ltr" className="font-medium text-foreground">
                {data.phone ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground-muted">ایمیل</span>
              <span dir="ltr" className="font-medium text-foreground">
                {data.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground-muted">کد پستی</span>
              <span className="font-medium text-foreground">{data.postal_code ?? "—"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-foreground-muted">آخرین آدرس</span>
              <p className="leading-6 text-foreground">{data.last_address ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>برچسب‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canTags ? (
              <UpgradeGate
                compact
                description="برچسب مشتری از پلن حرفه‌ای به بالا فعاله."
              />
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      label="برچسب جدید"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="مثلاً VIP"
                    />
                  </div>
                  <Button loading={tagBusy} onClick={() => void handleCreateTag()}>
                    بساز و بزن
                  </Button>
                </div>
                {!allTags?.length ? (
                  <p className="text-sm text-foreground-muted">هنوز برچسبی نساختی.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const active = selectedIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          disabled={tagBusy}
                          onClick={() => void toggleTag(tag.id)}
                          className={
                            active
                              ? "rounded-full border border-brand bg-brand/10 px-3 py-1 text-sm text-foreground"
                              : "rounded-full border border-border px-3 py-1 text-sm text-foreground-muted hover:border-brand/40"
                          }
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سفارش‌های این مشتری</CardTitle>
        </CardHeader>
        <CardContent>
          {data.orders.length === 0 ? (
            <EmptyState title="سفارشی ندارد" description="این مشتری هنوز سفارشی ثبت نکرده." />
          ) : (
            <Table embedded>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>فاکتور</TableHeaderCell>
                  <TableHeaderCell>وضعیت</TableHeaderCell>
                  <TableHeaderCell>مبلغ</TableHeaderCell>
                  <TableHeaderCell>تاریخ</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={paths.seller.orderDetail(order.id)}
                        className="font-medium text-brand hover:underline"
                      >
                        {order.invoice_code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatMoney(order.total_amount)}</TableCell>
                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
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
