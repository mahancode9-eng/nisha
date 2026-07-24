"use client";

import { useEffect, useState } from "react";
import * as subscriptionApi from "@/lib/api/seller/subscription";
import { ApiError } from "@/lib/api/errors";
import { formatToman } from "@/lib/pricing/planCatalog";
import { useToast } from "@/contexts/ToastContext";
import { PlanPricingGrid } from "@/components/pricing/PlanPricingGrid";
import { PricingPeriodToggle } from "@/components/pricing/PricingPeriodToggle";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type {
  BillingPeriod,
  CardInstructions,
  SellerSubscriptionDetail,
  SubscriptionCheckoutResponse,
  SubscriptionInvoice,
  SubscriptionPlan,
} from "@/types/subscription";

function invoiceStatusLabel(status: SubscriptionInvoice["status"]) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "در انتظار پرداخت";
    case "PROOF_UPLOADED":
      return "در انتظار تایید مدیر";
    case "PAID":
      return "پرداخت‌شده";
    case "REJECTED":
      return "رد شده";
    case "CANCELLED":
      return "لغو شده";
    default:
      return status;
  }
}

export default function SellerSubscriptionPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [detail, setDetail] = useState<SellerSubscriptionDetail | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [cardInstructions, setCardInstructions] = useState<CardInstructions | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>("MONTHLY");
  const [checkout, setCheckout] = useState<SubscriptionCheckoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, detailRes, invoicesRes, cardsRes] = await Promise.all([
        subscriptionApi.listPlans(),
        subscriptionApi.getSubscription(),
        subscriptionApi.listInvoices(),
        subscriptionApi.getCardInstructions(),
      ]);
      setPlans(plansRes);
      setDetail(detailRes);
      setInvoices(invoicesRes);
      setCardInstructions(cardsRes);
      const open = invoicesRes.find(
        (i) => i.status === "PENDING_PAYMENT" || i.status === "PROOF_UPLOADED",
      );
      if (open) {
        setCheckout(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بارگذاری اشتراک ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const openInvoice = invoices.find(
    (i) => i.status === "PENDING_PAYMENT" || i.status === "PROOF_UPLOADED",
  );

  const activeCards = checkout?.card_instructions ?? cardInstructions;
  const cardConfigured = Boolean(activeCards?.card_number?.trim());
  const pendingProof = openInvoice?.status === "PROOF_UPLOADED";
  const showPaymentCard = Boolean(checkout) || openInvoice?.status === "PENDING_PAYMENT";
  const paymentInvoice = checkout?.invoice ?? openInvoice;
  const paymentInvoiceId = paymentInvoice?.id;
  const currentPlanCode = detail?.effective_plan.code ?? null;

  async function handleCheckout(planCode: string) {
    if (planCode === "free" || openInvoice) return;
    setBusy(true);
    setBusyCode(planCode);
    try {
      const result = await subscriptionApi.checkout(planCode, period);
      setCheckout(result);
      setCardInstructions(result.card_instructions);
      if (!result.card_instructions.card_number?.trim()) {
        toast.error("کارت پلتفرم هنوز تنظیم نشده — با پشتیبانی تماس بگیرید");
      } else {
        toast.success("فاکتور ساخته شد. مبلغ را واریز و رسید را بارگذاری کنید.");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ایجاد فاکتور ناموفق بود");
    } finally {
      setBusy(false);
      setBusyCode(null);
    }
  }

  async function handleUpload(file: File | null, invoiceId: number) {
    if (!file) return;
    setBusy(true);
    try {
      await subscriptionApi.uploadProof(invoiceId, file);
      toast.success("رسید ارسال شد و در انتظار تایید مدیر است");
      setCheckout(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "بارگذاری رسید ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(invoiceId: number) {
    setBusy(true);
    try {
      await subscriptionApi.cancelInvoice(invoiceId);
      toast.success("فاکتور لغو شد");
      setCheckout(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "لغو فاکتور ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          پلن مناسب خود را انتخاب کنید
        </h1>
        <p className="text-sm leading-7 text-foreground-muted sm:text-base">
          بدون کارمزد روی سفارش مشتری. فقط برای ابزارهای پلتفرم پرداخت می‌کنید.
        </p>
        {detail && (
          <p className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground-muted">
            پلن فعلی:{" "}
            <span className="mr-1 font-medium text-foreground">{detail.effective_plan.name_fa}</span>
            {detail.is_expired_fallback && (
              <span className="mr-2 text-amber-700"> (بازگشت به رایگان پس از انقضا)</span>
            )}
          </p>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <LoadingState message="در حال بارگذاری پلن‌ها..." />
      ) : (
        <>
          <div className="flex justify-center">
            <PricingPeriodToggle value={period} onChange={setPeriod} />
          </div>

          {openInvoice && (
            <p className="text-center text-sm text-amber-700">
              یک فاکتور باز دارید؛ ابتدا آن را تکمیل یا لغو کنید، سپس پلن جدید بخرید.
            </p>
          )}

          <PlanPricingGrid
            plans={plans}
            period={period}
            currentPlanCode={currentPlanCode}
            busyCode={busyCode}
            disablePaid={!!openInvoice}
            onSelectPaid={(code) => {
              if (!openInvoice) void handleCheckout(code);
            }}
          />

          {pendingProof && openInvoice && (
            <Card className="border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10">
              <CardContent className="space-y-2 py-5">
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  در انتظار تایید مدیر
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-100/90">
                  رسید فاکتور #{openInvoice.id} ({formatToman(openInvoice.amount_toman)}) دریافت شده
                  است. پس از تایید ادمین، پلن شما فعال می‌شود.
                </p>
              </CardContent>
            </Card>
          )}

          {showPaymentCard && paymentInvoice && activeCards && (
            <Card>
              <CardHeader>
                <CardTitle>پرداخت کارت‌به‌کارت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!cardConfigured && (
                  <ErrorAlert message="کارت پلتفرم هنوز تنظیم نشده — با پشتیبانی تماس بگیرید" />
                )}
                <p>{activeCards.message}</p>
                <p>شماره کارت: {activeCards.card_number || "—"}</p>
                <p>به نام: {activeCards.card_owner || "—"}</p>
                <p>بانک: {activeCards.card_bank || "—"}</p>
                <p>
                  فاکتور #{paymentInvoice.id} — مبلغ: {formatToman(paymentInvoice.amount_toman)} —{" "}
                  {invoiceStatusLabel(paymentInvoice.status)}
                </p>
                {paymentInvoiceId != null && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!cardConfigured || busy}
                      onChange={(e) =>
                        void handleUpload(e.target.files?.[0] ?? null, paymentInvoiceId)
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleCancel(paymentInvoiceId)}
                      disabled={busy}
                    >
                      لغو فاکتور
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>تاریخچه فاکتورها</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {invoices.slice(0, 8).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex justify-between gap-3 border-b border-border py-2"
                  >
                    <span>
                      #{invoice.id} — {invoice.plan.name_fa} — {formatToman(invoice.amount_toman)}
                    </span>
                    <span className="text-foreground-muted">
                      {invoiceStatusLabel(invoice.status)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
