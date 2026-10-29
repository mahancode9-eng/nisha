"use client";

import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  planLabel,
  subscriptionUpgradeHref,
  type SuggestedPlan,
} from "@/lib/seller/upgrade";

type UpgradeGateProps = {
  title?: string;
  description: string;
  ctaLabel?: string;
  className?: string;
  compact?: boolean;
  /** Lowest plan that unlocks this feature — shown as a short hint. */
  suggestedPlan?: SuggestedPlan;
  /** Entitlement key for deep-link to /seller/subscription?feature=… */
  feature?: string;
};

export function UpgradeGate({
  title = "این امکان تو پلن بالاتر فعاله",
  description,
  ctaLabel = "دیدن پلن‌ها",
  className,
  compact = false,
  suggestedPlan,
  feature,
}: UpgradeGateProps) {
  const href = feature ? subscriptionUpgradeHref(feature) : paths.seller.subscription;
  const planHint = suggestedPlan
    ? `از پلن ${planLabel(suggestedPlan)} به بالا`
    : null;

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border border-brand/25 bg-brand/5 px-3.5 py-3 text-sm",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{title}</p>
          {planHint ? (
            <span className="rounded-full border border-brand/30 bg-surface px-2 py-0.5 text-xs text-brand">
              {planHint}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-foreground-muted">{description}</p>
        <Link
          href={href}
          className="mt-2 inline-flex font-medium text-brand hover:underline"
        >
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="space-y-3 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {planHint ? (
            <span className="rounded-full border border-brand/30 bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-brand">
              {planHint}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-foreground-muted">{description}</p>
        <Link href={href} className={buttonClassName()}>
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
