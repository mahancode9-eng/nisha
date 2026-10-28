import type { Metadata } from "next";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "نیشا فروشگاه‌ساز برای شروع سریع فروش آنلاین با کارت‌به‌کارت، بدون کارمزد روی سفارش مشتری.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10">
      <h1 className="text-3xl font-bold text-foreground">درباره ما</h1>
      <p className="mt-2 text-sm text-foreground-muted">فروشگاه‌ساز نیشا</p>

      <div className="mt-8 space-y-8 leading-8 text-foreground">
        <section>
          <h2 className="mb-3 text-xl font-semibold">۱. نیشا چیه؟</h2>
          <p>
            نیشا فروشگاه‌سازه که باهاش تو چند دقیقه ویترین آنلاین می‌سازی، محصول اضافه می‌کنی
            و با کارت‌به‌کارت می‌فروشی. از سفارش‌ها کارمزد نمی‌گیریم و فقط برای ابزارهای بیشتر
            پلن پولی داری.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">۲. برای کیه؟</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>کسی که تازه می‌خواد فروش آنلاین رو شروع کنه</li>
            <li>کسب‌وکاری که ویترین ساده، خرید مهمان و پیگیری سفارش می‌خواد</li>
            <li>فروشگاهی که داره رشد می‌کنه و آمار دقیق‌تر، تم اختصاصی و کد تخفیف لازم داره</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">۳. چطور کار می‌کنه؟</h2>
          <ol className="list-decimal space-y-2 pr-6">
            <li>حساب فروشنده می‌سازی و فروشگاه رو راه می‌ندازی.</li>
            <li>محصول‌ها، عکس‌ها و شماره کارت رو اضافه می‌کنی.</li>
            <li>خریدار از ویترین سفارش می‌ده. از پلن پایه به بالا، بدون ساختن حساب هم می‌تونه خرید کنه.</li>
            <li>وضعیت سفارش رو تو پنل به‌روز می‌کنی و خریدار سفارشش رو با کد فاکتور پیگیری می‌کنه.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">۴. قول ما</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>
              <strong>تعرفه روشن:</strong> قیمت پلن‌ها و امکانات هر کدوم تو صفحه قیمت‌ها هست.
            </li>
            <li>
              <strong>امنیت داده:</strong> اطلاعات روی ارتباط امن منتقل می‌شه، با دقت نگه داشته می‌شه و حریم خصوصی رعایت می‌شه.
            </li>
            <li>
              <strong>پشتیبانی:</strong> تو راه‌اندازی فروشگاه کنارتیم و به شکایت‌ها طبق رویه اعلام‌شده رسیدگی می‌کنیم.
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-muted/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">آماده‌ای شروع کنی؟</p>
          <p className="mt-1 text-sm text-foreground-muted">فروشگاهت رو با پلن رایگان بساز.</p>
        </div>
        <SellerPrimaryCta guestLabel="شروع رایگان" size="md" />
      </div>
    </div>
  );
}
