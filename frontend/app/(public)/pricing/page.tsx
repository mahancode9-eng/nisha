import type { Metadata } from "next";
import { LandingPricing } from "@/components/landing/LandingPricing";

export const metadata: Metadata = {
  title: "قیمت‌ها | نیشا",
  description:
    "تعرفه پلن‌های نیشا: شروع رایگان، بدون کارمزد روی سفارش. هزینه فقط برای ابزارهای بیشتر پلتفرم.",
};

export default function PricingPage() {
  return (
    <div className="py-6 sm:py-10">
      <LandingPricing />
    </div>
  );
}
