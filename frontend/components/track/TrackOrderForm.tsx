"use client";

import { useState, type FormEvent } from "react";
import * as ordersApi from "@/lib/api/public/orders";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import type { OrderTrackResponse } from "@/types/public/order";

type TrackOrderFormProps = {
  onSuccess: (order: OrderTrackResponse, password: string) => void;
};

export function TrackOrderForm({ onSuccess }: TrackOrderFormProps) {
  const [invoiceCode, setInvoiceCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const order = await ordersApi.trackOrder({
        invoice_code: invoiceCode.trim(),
        invoice_edit_password: password,
      });
      onSuccess(order, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "سفارش پیدا نشد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
              {error}
            </p>
          )}
          <Input
            label="کد فاکتور"
            value={invoiceCode}
            onChange={(e) => setInvoiceCode(e.target.value)}
            required
            autoComplete="off"
          />
          <Input
            label="رمز فاکتور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
          />
          <Button type="submit" className="w-full" loading={loading}>
            پیگیری سفارش
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
