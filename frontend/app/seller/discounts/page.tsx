"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import * as discountsApi from "@/lib/api/seller/discounts";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { DiscountCode, DiscountType } from "@/types/seller/discount";

export default function SellerDiscountsPage() {
  const toast = useToast();

  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [percentOff, setPercentOff] = useState("");
  const [amountOff, setAmountOff] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadDiscounts = useCallback(async () => {
    try {
      const data = await discountsApi.listDiscounts();
      setDiscounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بارگذاری کدهای تخفیف ممکن نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiscounts();
  }, [loadDiscounts]);

  function resetForm() {
    setCode("");
    setDiscountType("PERCENT");
    setPercentOff("");
    setAmountOff("");
    setMinOrderAmount("");
    setMaxUses("");
    setExpiresAt("");
    setDescription("");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    if (discountType === "PERCENT" && !percentOff.trim()) {
      toast.error("درصد تخفیف را وارد کنید");
      return;
    }
    if (discountType === "FIXED" && !amountOff.trim()) {
      toast.error("مبلغ تخفیف را وارد کنید");
      return;
    }
    setSubmitting(true);
    try {
      await discountsApi.createDiscount({
        code: code.trim(),
        description: description.trim() || null,
        discount_type: discountType,
        percent_off: discountType === "PERCENT" ? percentOff.trim() : null,
        amount_off: discountType === "FIXED" ? amountOff.trim() : null,
        min_order_amount: minOrderAmount.trim() || null,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
      });
      toast.success("کد تخفیف ساخته شد");
      resetForm();
      await loadDiscounts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ساخت کد تخفیف ناموفق بود");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(discount: DiscountCode) {
    setBusyId(discount.id);
    try {
      await discountsApi.updateDiscount(discount.id, { is_active: !discount.is_active });
      await loadDiscounts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "به‌روزرسانی ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(discount: DiscountCode) {
    if (!window.confirm("کد تخفیف " + discount.code + " حذف شود؟")) return;
    setBusyId(discount.id);
    try {
      await discountsApi.deleteDiscount(discount.id);
      toast.success("کد تخفیف حذف شد");
      await loadDiscounts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حذف ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState message="در حال بارگذاری کدهای تخفیف..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">کدهای تخفیف</h1>
        <p className="mt-1 text-foreground-muted">
          کد تخفیف درصدی یا مبلغی بسازید و برای مشتریان خود بفرستید. مشتری هنگام پرداخت کد را وارد می‌کند.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>کد تخفیف جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input
              label="کد"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="مثلا SAVE10"
              required
            />
            <label className="block text-sm text-foreground">
              <span className="mb-1 block font-medium">نوع تخفیف</span>
              <select
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              >
                <option value="PERCENT">درصدی</option>
                <option value="FIXED">مبلغ ثابت</option>
              </select>
            </label>
            {discountType === "PERCENT" ? (
              <Input
                label="درصد تخفیف"
                type="number"
                min="1"
                max="100"
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                placeholder="مثلا 10"
              />
            ) : (
              <Input
                label="مبلغ تخفیف"
                type="number"
                min="1"
                value={amountOff}
                onChange={(e) => setAmountOff(e.target.value)}
                placeholder="مثلا 50000"
              />
            )}
            <Input
              label="حداقل مبلغ سفارش (اختیاری)"
              type="number"
              min="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
            />
            <Input
              label="سقف تعداد استفاده (اختیاری)"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
            <Input
              label="تاریخ انقضا (اختیاری)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <Input
              label="توضیح (اختیاری)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="md:col-span-2"
            />
            <div className="md:col-span-2">
              <Button type="submit" loading={submitting}>
                ساخت کد تخفیف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>کدهای موجود</CardTitle>
        </CardHeader>
        <CardContent>
          {discounts.length === 0 ? (
            <p className="text-sm text-foreground-muted">هنوز کد تخفیفی نساخته‌اید.</p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>کد</TableHeaderCell>
                  <TableHeaderCell>تخفیف</TableHeaderCell>
                  <TableHeaderCell>حداقل سفارش</TableHeaderCell>
                  <TableHeaderCell>مصرف</TableHeaderCell>
                  <TableHeaderCell>انقضا</TableHeaderCell>
                  <TableHeaderCell>وضعیت</TableHeaderCell>
                  <TableHeaderCell>عملیات</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <span className="font-mono font-semibold">{discount.code}</span>
                      {discount.description && (
                        <p className="text-xs text-foreground-muted">{discount.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {discount.discount_type === "PERCENT"
                        ? Number(discount.percent_off ?? 0) + "٪"
                        : formatMoney(discount.amount_off ?? "0")}
                    </TableCell>
                    <TableCell>
                      {discount.min_order_amount ? formatMoney(discount.min_order_amount) : "—"}
                    </TableCell>
                    <TableCell>
                      {discount.used_count}
                      {discount.max_uses ? " / " + discount.max_uses : ""}
                    </TableCell>
                    <TableCell>
                      {discount.expires_at ? formatDateTime(discount.expires_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount.is_active ? "success" : "warning"}>
                        {discount.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={busyId === discount.id}
                          onClick={() => void handleToggle(discount)}
                        >
                          {discount.is_active ? "غیرفعال کن" : "فعال کن"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(discount)}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
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
