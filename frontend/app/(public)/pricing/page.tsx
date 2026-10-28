import type { Metadata } from "next";
import { LandingPricing } from "@/components/landing/LandingPricing";

export const metadata: Metadata = {
  title: "قیمت‌ها",
  description:
    "پلن‌های نیشا: شروع رایگان و بدون کارمزد روی سفارش‌ها. فقط برای ابزارهای بیشتر هزینه می‌دی.",
};

export default function PricingPage() {
  return (
    <div className="py-6 sm:py-10">
      <LandingPricing />
    </div>
  );
}
