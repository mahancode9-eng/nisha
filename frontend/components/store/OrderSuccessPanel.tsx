"use client";

import Link from "next/link";
import { useState } from "react";
import type { CheckoutResponse } from "@/types/public/checkout";
import { publicPaths } from "@/lib/paths/public";
import { formatMoney } from "@/lib/format";
import { PaymentInstructions } from "@/components/store/PaymentInstructions";
import { PaymentProofUpload } from "@/components/store/PaymentProofUpload";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

type OrderSuccessPanelProps = {
  order: CheckoutResponse;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-surface-muted p-3">
      <p className="text-xs font-medium uppercase text-foreground-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <code className="break-all text-sm font-semibold text-foreground">{value}</code>
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? "کپی شد" : "کپی"}
        </Button>
      </div>
    </div>
  );
}

export function OrderSuccessPanel({ order }: OrderSuccessPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">سفارش با موفقیت ثبت شد</h2>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
          کد فاکتور و رمز عبور را در پایین ذخیره کنید. برای پیگیری سفارش و بارگذاری رسید پرداخت به
          آنها نیاز خواهید داشت.
        </p>
      </div>

      <div className="rounded-xl border-2 border-red-500/20 bg-red-500/10 p-4">
        <p className="font-semibold text-red-900 dark:text-red-100">مهم - همین حالا ذخیره کنید</p>
        <p className="mt-1 text-sm text-red-800 dark:text-red-200">
          رمز فاکتور فقط یک‌بار نمایش داده می‌شود. امکان بازیابی آن وجود ندارد.
        </p>
        <div className="mt-4 space-y-3">
          <CopyField label="کد فاکتور" value={order.invoice_code} />
          <CopyField label="رمز فاکتور" value={order.invoice_edit_password} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="text-sm text-foreground-muted">
          جمع کل: {formatMoney(order.total_amount)}
        </span>
      </div>

      <PaymentInstructions method={order.payment_method} />

      <PaymentProofUpload
        invoiceCode={order.invoice_code}
        defaultPassword={order.invoice_edit_password}
      />

      <div className="flex flex-wrap gap-3">
        <Link href={publicPaths.trackOrder}>
          <Button variant="secondary">پیگیری این سفارش</Button>
        </Link>
        <Link href={publicPaths.invoice(order.invoice_code)}>
          <Button variant="ghost">فاکتور چاپی</Button>
        </Link>
      </div>
    </div>
  );
}
