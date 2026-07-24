"use client";

import { useState } from "react";
import { PlanPricingGrid } from "@/components/pricing/PlanPricingGrid";
import { PricingPeriodToggle } from "@/components/pricing/PricingPeriodToggle";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { Reveal } from "@/components/landing/Reveal";
import { PLAN_CATALOG } from "@/lib/pricing/planCatalog";
import { paths } from "@/lib/auth/paths";
import type { BillingPeriod } from "@/types/subscription";

export function LandingPricing() {
  const [period, setPeriod] = useState<BillingPeriod>("MONTHLY");

  return (
    <section className="space-y-10">
      <Reveal>
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-sm font-medium tracking-[0.26em] text-brand">تعرفه</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
            شروع رایگان، ابزارهای پیشرفته با اشتراک
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
            روی سفارش مشتری کارمزدی نمی‌گیریم. هزینه فقط برای ابزارهای پلتفرم است — هر وقت آماده‌ای ارتقا
            بده.
          </p>
        </div>
      </Reveal>

      <div className="flex justify-center">
        <PricingPeriodToggle value={period} onChange={setPeriod} />
      </div>

      <PlanPricingGrid
        plans={[...PLAN_CATALOG]}
        period={period}
        renderCta={(plan) => (
          <SellerPrimaryCta
            size="md"
            className="w-full px-4"
            variant={plan.is_recommended ? "primary" : "secondary"}
            guestLabel={plan.code === "free" ? "شروع رایگان" : "ثبت‌نام و ارتقا"}
            sellerLabel="مدیریت اشتراک"
            sellerHref={paths.seller.subscription}
          />
        )}
      />
    </section>
  );
}
