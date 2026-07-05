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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("لطفا یک فایل تصویر انتخاب کنید.");
      return;
    }
    if (!password.trim()) {
      setError("رمز فاکتور الزامی است.");
      return;
    }
    setLoading(true);
    try {
      await ordersApi.uploadPaymentProof(invoiceCode, password.trim(), file);
      toast.success("رسید پرداخت ثبت شد. فروشنده پس از بررسی، پرداخت را تایید می‌کند.");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "بارگذاری ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <h3 className="font-semibold text-foreground">بارگذاری رسید پرداخت</h3>
      <p className="text-sm text-foreground-muted">
        از پرداخت خود یک اسکرین‌شات یا عکس بارگذاری کنید. فروشنده پس از بررسی آن را تایید می‌کند.
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
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">فایل تصویر</label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm text-foreground hover:bg-surface">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file ? file.name : "انتخاب فایل"}
        </label>
      </div>
      <Button type="submit" loading={loading} disabled={!file}>
        بارگذاری رسید
      </Button>
    </form>
  );
}
