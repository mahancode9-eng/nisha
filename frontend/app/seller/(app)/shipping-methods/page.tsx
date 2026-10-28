"use client";

import { useState } from "react";
import * as shippingMethodsApi from "@/lib/api/seller/shipping-methods";
import { formatMoney } from "@/lib/format";
import { moneyInputToNumber, parseMoneyInput, formatMoneyInput } from "@/lib/moneyInput";
import { useToast } from "@/contexts/ToastContext";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { ApiError } from "@/lib/api/errors";
import type { ShippingMethod } from "@/types/seller/shipping-method";

export default function SellerShippingMethodsPage() {
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canManage = Boolean(entitlements.named_shipping_methods);
  const { data, error, isLoading, refetch } = useSellerFetch(
    () =>
      canManage
        ? shippingMethodsApi.listShippingMethods()
        : Promise.resolve([]),
    [canManage],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingMethod | undefined>();
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [etaLabel, setEtaLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(undefined);
    setName("");
    setCost("0");
    setEtaLabel("");
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(method: ShippingMethod) {
    setEditing(method);
    setName(method.name);
    setCost(formatMoneyInput(method.cost));
    setEtaLabel(method.eta_label ?? "");
    setIsActive(method.is_active);
    setModalOpen(true);
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("اسم روش ارسال رو بنویس.");
      return;
    }
    if (!parseMoneyInput(cost)) {
      toast.error("هزینه ارسال رو درست وارد کن.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: trimmed,
        cost: moneyInputToNumber(cost),
        eta_label: etaLabel.trim() || null,
        is_active: isActive,
      };
      if (editing) {
        await shippingMethodsApi.updateShippingMethod(editing.id, body);
        toast.success("تغییرات ذخیره شد");
      } else {
        await shippingMethodsApi.createShippingMethod(body);
        toast.success("روش ارسال اضافه شد");
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await shippingMethodsApi.deleteShippingMethod(deleteId);
      toast.success("روش ارسال حذف شد");
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error("حذف نشد. دوباره امتحان کن.");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) return <LoadingState message="داره روش‌های ارسال رو بارگذاری می‌کنه…" />;

  return (
    <div className="page-stack">
      <PageHeader
        description="روش‌هایی که مشتری موقع خرید انتخاب می‌کنه"
        action={
          canManage ? (
            <Button onClick={openCreate}>افزودن روش ارسال</Button>
          ) : undefined
        }
      />

      {!canManage ? (
        <UpgradeGate description="روش‌های ارسال نام‌دار از پلن پایه به بالا فعاله." />
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {canManage && !error && data?.length === 0 ? (
        <EmptyState
          title="هنوز روش ارسالی نداری"
          description="چند تا گزینه مثل پست پیشتاز یا پیک موتوری بساز تا مشتری انتخاب کنه."
          action={<Button onClick={openCreate}>افزودن روش ارسال</Button>}
        />
      ) : null}

      {canManage && data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((method) => (
            <Card key={method.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{method.name}</p>
                    <Badge variant={method.is_active ? "success" : "neutral"}>
                      {method.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {formatMoney(method.cost)}
                    {method.eta_label ? ` · ${method.eta_label}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(method)}>
                    ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => setDeleteId(method.id)}
                  >
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "ویرایش روش ارسال" : "روش ارسال جدید"}
      >
        <div className="space-y-4">
          <Input label="نام" value={name} onChange={(e) => setName(e.target.value)} required />
          <MoneyInput label="هزینه" value={cost} onValueChange={setCost} />
          <Input
            label="زمان تقریبی"
            value={etaLabel}
            onChange={(e) => setEtaLabel(e.target.value)}
            hint="مثلاً ۱ تا ۳ روز کاری"
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            فعال
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              انصراف
            </Button>
            <Button loading={saving} onClick={() => void handleSubmit()}>
              ذخیره
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="حذف روش ارسال"
        message="این روش ارسال حذف بشه؟"
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
