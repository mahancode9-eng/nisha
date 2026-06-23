"use client";

import { useState } from "react";
import * as paymentMethodsApi from "@/lib/api/seller/payment-methods";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { PageHeader } from "@/components/seller/PageHeader";
import { PaymentMethodForm } from "@/components/seller/PaymentMethodForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import type {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodUpdate,
} from "@/types/seller/payment-method";

const TYPE_LABELS: Record<string, string> = {
  CARD_TO_CARD: "کارت‌به‌کارت",
  CRYPTO: "رمزارز",
  EXTERNAL_GATEWAY: "درگاه خارجی",
};

export default function SellerPaymentMethodsPage() {
  const toast = useToast();
  const { data, error, isLoading, refetch } = useSellerFetch(
    () => paymentMethodsApi.listPaymentMethods(),
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(method: PaymentMethod) {
    setEditing(method);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(undefined);
  }

  async function handleSubmit(body: PaymentMethodCreate | PaymentMethodUpdate) {
    if (editing) {
      await paymentMethodsApi.updatePaymentMethod(editing.id, body as PaymentMethodUpdate);
      toast.success("روش پرداخت به‌روزرسانی شد");
    } else {
      await paymentMethodsApi.createPaymentMethod(body as PaymentMethodCreate);
      toast.success("روش پرداخت ایجاد شد");
    }
    closeModal();
    await refetch();
  }

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await paymentMethodsApi.deletePaymentMethod(deleteId);
      toast.success("روش پرداخت حذف شد");
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error("حذف روش پرداخت ناموفق بود");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری روش‌های پرداخت..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="روش‌های پرداخت"
        description="مشتریان چگونه می‌توانند به شما پرداخت کنند"
        action={<Button onClick={openCreate}>افزودن روش</Button>}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!error && data?.length === 0 && (
        <EmptyState
          title="هنوز روش پرداختی ثبت نشده"
          description="حداقل یک روش برای پرداخت مشتریان اضافه کنید."
          action={<Button onClick={openCreate}>افزودن روش</Button>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((method) => (
          <Card key={method.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-neutral-900">{method.display_name}</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {TYPE_LABELS[method.type] ?? method.type}
                  </p>
                </div>
                <Badge variant={method.is_active ? "success" : "neutral"}>
                  {method.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
              {method.type === "CARD_TO_CARD" && method.card_number && (
                <p className="mt-2 text-sm text-neutral-600">کارت: {method.card_number}</p>
              )}
              {method.type === "CRYPTO" && method.wallet_address && (
                <p className="mt-2 truncate text-sm text-neutral-600">
                  {method.wallet_address}
                </p>
              )}
              {method.type === "EXTERNAL_GATEWAY" && method.external_url && (
                <p className="mt-2 truncate text-sm text-brand">{method.external_url}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(method)}>
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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "ویرایش روش پرداخت" : "روش پرداخت جدید"}
      >
        <PaymentMethodForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="حذف روش پرداخت"
        message="مشتریان دیگر نمی‌توانند از این روش پرداخت استفاده کنند."
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
