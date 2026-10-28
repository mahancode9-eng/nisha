"use client";

import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { buttonClassName } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type UpgradeGateProps = {
  title?: string;
  description: string;
  ctaLabel?: string;
  className?: string;
  compact?: boolean;
};

export function UpgradeGate({
  title = "این امکان تو پلن بالاتر فعاله",
  description,
  ctaLabel = "دیدن پلن‌ها",
  className,
  compact = false,
}: UpgradeGateProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border border-brand/25 bg-brand/5 px-3.5 py-3 text-sm",
          className,
        )}
      >
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-foreground-muted">{description}</p>
        <Link
          href={paths.seller.subscription}
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
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-foreground-muted">{description}</p>
        <Link href={paths.seller.subscription} className={buttonClassName()}>
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
