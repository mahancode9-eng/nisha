"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { landingButtonClasses, type LandingButtonSize, type LandingButtonVariant } from "@/components/landing/buttonStyles";

type SellerPrimaryCtaProps = {
  variant?: LandingButtonVariant;
  size?: LandingButtonSize;
  className?: string;
  guestLabel?: string;
  sellerLabel?: string;
  sellerHref?: string;
};

export function SellerPrimaryCta({
  variant = "primary",
  size = "md",
  className,
  guestLabel = "شروع فروش",
  sellerLabel = "رفتن به داشبورد",
  sellerHref = paths.seller.dashboard,
}: SellerPrimaryCtaProps) {
  const { user, isLoading } = useAuth();
  const isSeller = !isLoading && user?.role === "SELLER";

  return (
    <Link
      href={isSeller ? sellerHref : paths.seller.register}
      className={landingButtonClasses({ variant, size, className })}
    >
      {isSeller ? sellerLabel : guestLabel}
    </Link>
  );
}
