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
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { paths } from "@/lib/auth/paths";
import {
  DISCOUNT_TEMPLATES,
  expiresAtFromDays,
  type DiscountTemplate,
} from "@/lib/seller/discountTemplates";
import { toastApiFailure } from "@/lib/seller/upgrade";
import type { DiscountCode, DiscountType } from "@/types/seller/discount";
import Link from "next/link";

export default function SellerDiscountsPage() {
  const toast = useToast();
  const { entitlements, isLoading: entitlementsLoading } = useSellerEntitlements();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageDiscounts = entitlements.discounts;
  const canTimedDiscounts = entitlements.timed_discounts;
  const activeCount = discounts.filter((d) => d.is_active).length;
  const maxActive = entitlements.max_active_discount_codes;
  const atActiveCap = maxActive != null && activeCount >= maxActive;

  const [upgradeHint, setUpgradeHint] = useState<string | null>(null);
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
      setError(err instanceof ApiError ? err.message : "کدهای تخفیف باز نشد. صفحه رو دوباره باز کن.");
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

  function applyTemplate(template: DiscountTemplate) {
    setCode(template.code);
    setDiscountType(template.discount_type);
    setPercentOff(template.percent_off ?? "");
    setAmountOff(template.amount_off ?? "");
    setMinOrderAmount(template.min_order_amount ?? "");
    setMaxUses(template.max_uses ?? "");
    setDescription(template.description);
    if (canTimedDiscounts && template.expires_in_days) {
      setExpiresAt(expiresAtFromDays(template.expires_in_days));
    } else {
      setExpiresAt("");
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    if (discountType === "PERCENT" && !percentOff.trim()) {
      toast.error("درصد تخفیف رو وارد کن");
      return;
    }
    if (discountType === "FIXED" && !amountOff.trim()) {
      toast.error("مبلغ تخفیف رو وارد کن");
      return;
    }
    if (!canTimedDiscounts && expiresAt) {
      toast.error("تاریخ انقضا فقط تو پلن پایه به بالاست. پلن رو ارتقا بده.");
      return;
    }
    setSubmitting(true);
    setUpgradeHint(null);
    try {
      await discountsApi.createDiscount({
        code: code.trim(),
        description: description.trim() || null,
        discount_type: discountType,
        percent_off: discountType === "PERCENT" ? percentOff.trim() : null,
        amount_off: discountType === "FIXED" ? amountOff.trim() : null,
        min_order_amount: minOrderAmount.trim() || null,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        expires_at: canTimedDiscounts && expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
      });
      toast.success("کد تخفیف ساخته شد");
      resetForm();
      await loadDiscounts();
    } catch (err) {
      if (err instanceof ApiError && err.upgradeRequired) {
        setUpgradeHint(err.message);
      }
      toastApiFailure(toast, err, "کد تخفیف ساخته نشد. دوباره امتحان کن.");
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
      toast.error(err instanceof ApiError ? err.message : "تغییر ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(discount: DiscountCode) {
    if (!window.confirm("کد تخفیف " + discount.code + " حذف بشه؟")) return;
    setBusyId(discount.id);
    try {
      await discountsApi.deleteDiscount(discount.id);
      toast.success("کد تخفیف حذف شد");
      await loadDiscounts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حذف نشد. دوباره امتحان کن.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState message="داره کدهای تخفیف رو بارگذاری می‌کنه…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground max-md:text-xl">کدهای تخفیف</h1>
        <p className="mt-1 text-foreground-muted">
          کد تخفیف درصدی یا مبلغی بساز و برای مشتری‌ها بفرست. مشتری موقع ثبت سفارش، کد رو وارد می‌کنه.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {!entitlementsLoading && !canManageDiscounts && (
        <UpgradeGate
          feature="discounts"
          suggestedPlan="basic"
          description="کد تخفیف تو پلن فعلی‌ت فعال نیست. پلن رو ارتقا بده."
        />
      )}

      {!entitlementsLoading && canManageDiscounts && atActiveCap && maxActive === 1 && (
        <UpgradeGate
          feature="discounts"
          suggestedPlan="basic"
          description="تو پلن رایگان فقط یک کد تخفیف فعال می‌تونی داشته باشی. برای کدهای بیشتر پلن رو ارتقا بده."
        />
      )}

      {canManageDiscounts && (
      <Card>
        <CardHeader>
          <CardTitle>کد تخفیف جدید</CardTitle>
          {maxActive != null && (
            <p className="text-sm text-foreground-muted">
              کد فعال: {activeCount} از {maxActive}
              {atActiveCap ? " — برای ساخت فعال جدید، یکی رو غیرفعال کن یا پلن رو ارتقا بده." : ""}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {upgradeHint ? (
            <UpgradeGate
              compact
              feature="discounts"
              suggestedPlan="basic"
              description={upgradeHint}
              ctaLabel="ارتقا بده"
            />
          ) : null}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">قالب آماده</p>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-xl border border-border bg-surface-muted/40 px-3 py-2 text-start text-sm transition hover:border-brand/40"
                >
                  <span className="block font-medium text-foreground">{template.label}</span>
                  <span className="block text-xs text-foreground-muted">{template.description}</span>
                </button>
              ))}
            </div>
            {!canTimedDiscounts ? (
              <p className="text-xs text-foreground-muted">
                تاریخ انقضای قالب‌ها فقط تو پلن پایه به بالاست.
              </p>
            ) : null}
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input
              label="کد"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="مثلاً SAVE10"
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
                placeholder="مثلاً ۱۰"
              />
            ) : (
              <Input
                label="مبلغ تخفیف"
                type="number"
                min="1"
                value={amountOff}
                onChange={(e) => setAmountOff(e.target.value)}
                placeholder="مثلاً ۵۰۰۰۰"
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
            <div className="space-y-1">
              <Input
                label="تاریخ انقضا (اختیاری)"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={!canTimedDiscounts}
              />
              {!canTimedDiscounts && (
                <p className="text-xs text-foreground-muted">
                  تاریخ انقضا فقط تو پلن پایه به بالاست.{" "}
                  <Link href={paths.seller.subscription} className="text-brand underline-offset-2 hover:underline">
                    ارتقای پلن
                  </Link>
                </p>
              )}
            </div>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>کدهات</CardTitle>
        </CardHeader>
        <CardContent>
          {discounts.length === 0 ? (
            <p className="text-sm text-foreground-muted">هنوز کد تخفیفی نساختی.</p>
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
                          {discount.is_active ? "غیرفعال کردن" : "فعال کردن"}
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
