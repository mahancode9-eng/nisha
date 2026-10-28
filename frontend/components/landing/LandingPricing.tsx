"use client";

import { useState } from "react";
import { PlanPricingGrid } from "@/components/pricing/PlanPricingGrid";
import { PricingPeriodToggle } from "@/components/pricing/PricingPeriodToggle";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { Reveal } from "@/components/landing/Reveal";
import { PLAN_CATALOG } from "@/lib/pricing/planCatalog";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import type { BillingPeriod } from "@/types/subscription";

export function LandingPricing({ className }: { className?: string }) {
  const [period, setPeriod] = useState<BillingPeriod>("MONTHLY");

  return (
    <section className={cn("space-y-10", className)}>
      <Reveal>
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="landing-eyebrow">قیمت‌ها</p>
          <h2 className="landing-display text-3xl text-white sm:text-4xl lg:text-5xl">
            رایگان شروع کن؛ از فروش کارمزد نمی‌گیریم
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            پلن پولی فقط برای ابزارهای بیشتره. هر وقت لازم شد، عوض می‌کنی.
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
