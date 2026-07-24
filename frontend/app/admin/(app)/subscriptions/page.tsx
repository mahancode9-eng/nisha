"use client";

import { useEffect, useState } from "react";
import * as subscriptionsApi from "@/lib/api/admin/subscriptions";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { AdminSubscriptionInvoice, SubscriptionInvoiceStatus } from "@/types/subscription";

function formatToman(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

function invoiceStatusLabel(status: SubscriptionInvoiceStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "در انتظار پرداخت";
    case "PROOF_UPLOADED":
      return "در انتظار تایید";
    case "PAID":
      return "پرداخت‌شده";
    case "REJECTED":
      return "ردشده";
    case "CANCELLED":
      return "لغو شده";
    default:
      return status;
  }
}

export default function AdminSubscriptionsPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<AdminSubscriptionInvoice[]>([]);
  const [status, setStatus] = useState<SubscriptionInvoiceStatus | "">("PROOF_UPLOADED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setInvoices(await subscriptionsApi.listInvoices(status || undefined));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بارگذاری فاکتورها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function confirm(id: number) {
    setBusyId(id);
    try {
      await subscriptionsApi.confirmInvoice(id);
      toast.success("پرداخت تایید و اشتراک فعال شد");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تایید ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: number) {
    setBusyId(id);
    try {
      await subscriptionsApi.rejectInvoice(id, "رسید تایید نشد");
      toast.success("فاکتور رد شد");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "رد فاکتور ناموفق بود");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="اشتراک‌های فروشندگان"
        description="رسیدهای کارت‌به‌کارت اشتراک را بررسی و تایید کنید"
      />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["PROOF_UPLOADED", "در انتظار تایید"],
            ["PENDING_PAYMENT", "در انتظار پرداخت"],
            ["PAID", "پرداخت‌شده"],
            ["REJECTED", "ردشده"],
            ["", "همه"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value || "all"}
            type="button"
            size="sm"
            variant={status === value ? "primary" : "secondary"}
            onClick={() => setStatus(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      {error && <ErrorAlert message={error} />}
      {loading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : (
        <div className="space-y-3">
          {invoices.length === 0 && (
            <Card>
              <CardContent className="py-8 text-sm text-foreground-muted">
                فاکتوری یافت نشد.
              </CardContent>
            </Card>
          )}
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <CardTitle>
                  #{invoice.id} — {invoice.plan.name_fa} — {formatToman(invoice.amount_toman)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  فروشنده: {invoice.seller_full_name || "—"} ({invoice.seller_email || "—"})
                </p>
                <p>وضعیت: {invoiceStatusLabel(invoice.status)}</p>
                <p>
                  دوره:{" "}
                  {invoice.period === "YEARLY"
                    ? "سالانه"
                    : invoice.period === "QUARTERLY"
                      ? "سه‌ماهه"
                      : "ماهانه"}
                </p>
                {invoice.admin_note && (
                  <p className="text-foreground-muted">یادداشت: {invoice.admin_note}</p>
                )}

                <div className="space-y-3">
                  <p className="font-medium text-foreground">رسیدهای پرداخت</p>
                  {invoice.proofs.length === 0 ? (
                    <p className="text-foreground-muted">رسیدی بارگذاری نشده</p>
                  ) : (
                    invoice.proofs.map((proof) => {
                      const url = resolveMediaUrl(proof.image_url);
                      return (
                        <a
                          key={proof.id}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block space-y-2 rounded-xl border border-border p-3 hover:border-brand/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`رسید ${proof.id}`}
                            className="max-h-48 w-full rounded-lg border border-border object-contain bg-surface-muted"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-muted">
                            <span className="underline">مشاهده رسید</span>
                            <span>{formatDateTime(proof.uploaded_at)}</span>
                          </div>
                        </a>
                      );
                    })
                  )}
                </div>

                {(invoice.status === "PROOF_UPLOADED" || invoice.status === "PENDING_PAYMENT") && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      loading={busyId === invoice.id}
                      onClick={() => void confirm(invoice.id)}
                    >
                      تایید پرداخت
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyId === invoice.id}
                      onClick={() => void reject(invoice.id)}
                    >
                      رد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
