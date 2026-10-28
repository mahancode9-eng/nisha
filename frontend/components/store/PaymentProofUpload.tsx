"use client";

import { useRef, useState, type FormEvent } from "react";
import * as ordersApi from "@/lib/api/public/orders";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PaymentProofUploadProps = {
  invoiceCode: string;
  defaultPassword?: string;
  onSuccess?: () => void;
};

export function PaymentProofUpload({
  invoiceCode,
  defaultPassword = "",
  onSuccess,
}: PaymentProofUploadProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState(defaultPassword);
  const [file, setFile] = useState<File | null>(null);
  const [cardLast4, setCardLast4] = useState("");
  const [transferTracking, setTransferTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("عکس رسید رو انتخاب کن.");
      return;
    }
    if (!password.trim()) {
      setError("رمز فاکتور رو وارد کن.");
      return;
    }
    const last4 = cardLast4.trim();
    if (last4 && !/^\d{4}$/.test(last4)) {
      setError("چهار رقم آخر کارت رو درست بنویس.");
      return;
    }
    setLoading(true);
    try {
      const result = await ordersApi.uploadPaymentProof(invoiceCode, password.trim(), file, {
        payerCardLast4: last4 || null,
        transferTracking: transferTracking.trim() || null,
      });
      if (result.duplicate_warning) {
        const codes = result.duplicate_invoice_codes?.join("، ") ?? "";
        toast.error(
          codes
            ? `این رسید شبیه سفارش‌های دیگه است: ${codes}. فروشنده بررسی می‌کنه.`
            : "این رسید شبیه یه رسید دیگه است. فروشنده بررسی می‌کنه.",
        );
      } else {
        toast.success("رسیدت ثبت شد. فروشنده بعد از بررسی، پرداخت رو تایید می‌کنه.");
      }
      setFile(null);
      setCardLast4("");
      setTransferTracking("");
      if (fileRef.current) fileRef.current.value = "";
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "رسید ارسال نشد. دوباره امتحان کن.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <h3 className="font-semibold text-foreground">فرستادن رسید پرداخت</h3>
      <p className="text-sm text-foreground-muted">
        از رسید کارت‌به‌کارت عکس یا اسکرین‌شات بگیر و اینجا بذار. فروشنده بعد از بررسی، پرداخت رو تایید می‌کنه.
      </p>
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
          {error}
        </p>
      )}
      <Input
        label="رمز فاکتور"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="چهار رقم آخر کارت (اختیاری)"
          value={cardLast4}
          onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          dir="ltr"
          inputMode="numeric"
          maxLength={4}
        />
        <Input
          label="کد پیگیری واریز (اختیاری)"
          value={transferTracking}
          onChange={(e) => setTransferTracking(e.target.value)}
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">عکس رسید</label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm text-foreground hover:bg-surface">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file ? file.name : "انتخاب عکس"}
        </label>
      </div>
      <Button type="submit" loading={loading} disabled={!file}>
        بارگذاری رسید
      </Button>
    </form>
  );
}
