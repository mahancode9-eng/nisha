"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  equivalentMonthly,
  formatToman,
  highlightsForPlan,
  periodLabel,
  priceForPeriod,
  type CatalogPlan,
} from "@/lib/pricing/planCatalog";
import type { BillingPeriod, SubscriptionPlan } from "@/types/subscription";

export type PricingPlanItem = SubscriptionPlan | CatalogPlan;

type PlanPricingGridProps = {
  plans: PricingPlanItem[];
  period: BillingPeriod;
  currentPlanCode?: string | null;
  busyCode?: string | null;
  disablePaid?: boolean;
  onSelectPaid?: (planCode: string) => void;
  renderCta?: (plan: PricingPlanItem, price: number) => ReactNode;
  className?: string;
};

export function PlanPricingGrid({
  plans,
  period,
  currentPlanCode,
  busyCode,
  disablePaid = false,
  onSelectPaid,
  renderCta,
  className,
}: PlanPricingGridProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
      {plans.map((plan) => {
        const price = priceForPeriod(plan, period);
        const monthlyEq = equivalentMonthly(price, period);
        const isCurrent = currentPlanCode === plan.code;
        const isFree = plan.code === "free";
        const highlights = highlightsForPlan(plan);
        const blurb = "blurb" in plan ? plan.blurb : undefined;
        const paidDisabled = disablePaid || isCurrent || busyCode === plan.code;

        return (
          <article
            key={plan.code}
            className={cn(
              "relative flex h-full flex-col rounded-3xl border p-6 shadow-sm transition-shadow",
              plan.is_recommended
                ? "border-brand/50 bg-brand/5 ring-1 ring-brand/20"
                : "border-border/70 bg-surface/90",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{plan.name_fa}</h3>
                {blurb && <p className="mt-1 text-sm text-foreground-muted">{blurb}</p>}
              </div>
              {plan.is_recommended && (
                <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white">
                  پیشنهادی
                </span>
              )}
            </div>

            <div className="mt-6">
              <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {isFree || price === 0 ? "۰ تومان" : formatToman(price)}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                {isFree ? "همیشه رایگان" : periodLabel(period)}
                {monthlyEq != null && period !== "MONTHLY" && (
                  <span> · معادل {formatToman(monthlyEq)} در ماه</span>
                )}
              </p>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-foreground">
              {highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-brand" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {renderCta ? (
                renderCta(plan, price)
              ) : (
                <button
                  type="button"
                  disabled={isFree || paidDisabled}
                  onClick={() => {
                    if (!isFree && !paidDisabled && onSelectPaid) onSelectPaid(plan.code);
                  }}
                  className={cn(
                    "inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                    plan.is_recommended
                      ? "bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
                      : "border border-border bg-surface text-foreground hover:bg-surface-muted disabled:opacity-60",
                  )}
                >
                  {isCurrent
                    ? "پلن فعلی شما"
                    : isFree
                      ? "شروع رایگان"
                      : busyCode === plan.code
                        ? "در حال ایجاد فاکتور..."
                        : "ادامه پرداخت"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
