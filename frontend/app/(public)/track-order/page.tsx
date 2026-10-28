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
        <h1 className="text-2xl font-bold text-foreground max-md:text-xl">پیگیری سفارش</h1>
        <p className="mt-1 text-foreground-muted">
          کد و رمز فاکتوری که بعد از ثبت سفارش گرفتی رو وارد کن.
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
            پیگیری سفارشی دیگر
          </button>
          <OrderTrackDetails order={order} password={password} onUpdated={setOrder} />
        </>
      )}
    </div>
  );
}
