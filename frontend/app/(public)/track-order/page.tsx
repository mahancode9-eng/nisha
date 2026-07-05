"use client";

import { useState } from "react";
import { OrderTrackDetails } from "@/components/track/OrderTrackDetails";
import { TrackOrderForm } from "@/components/track/TrackOrderForm";
import type { OrderTrackResponse } from "@/types/public/order";

export default function TrackOrderPage() {
  const [order, setOrder] = useState<OrderTrackResponse | null>(null);
  const [password, setPassword] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پیگیری سفارش</h1>
        <p className="mt-1 text-foreground-muted">
          کد فاکتور و رمزی را که هنگام ثبت سفارش دریافت کرده‌اید وارد کنید.
        </p>
      </div>

      {!order ? (
        <TrackOrderForm
          onSuccess={(o, pwd) => {
            setOrder(o);
            setPassword(pwd);
          }}
        />
      ) : (
        <>
          <button
            type="button"
            className="text-sm text-brand-deep hover:underline"
            onClick={() => {
              setOrder(null);
              setPassword("");
            }}
          >
            جستجوی سفارش دیگر
          </button>
          <OrderTrackDetails order={order} password={password} onUpdated={setOrder} />
        </>
      )}
    </div>
  );
}
