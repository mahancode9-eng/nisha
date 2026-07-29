import type { Metadata } from "next";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";

export const metadata: Metadata = {
  title: "درباره ما | نیشا",
  description:
    "نیشا فروشگاه‌ساز برای شروع سریع فروش آنلاین با کارت‌به‌کارت، بدون کارمزد روی سفارش مشتری.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-10">
      <h1 className="text-3xl font-bold text-foreground">درباره ما</h1>
      <p className="mt-2 text-sm text-foreground-muted">پلتفرم فروشگاه‌ساز نیشا</p>

      <div className="mt-8 space-y-8 leading-8 text-foreground">
        <section>
          <h2 className="mb-3 text-xl font-semibold">۱. نیشا چیست؟</h2>
          <p>
            نیشا یک فروشگاه‌ساز آنلاین است که به فروشندگان کمک می‌کند در چند دقیقه ویترین خود را
            بسازند، محصول اضافه کنند و با روش‌هایی مثل کارت‌به‌کارت فروش را شروع کنند. روی هر سفارش
            مشتری کارمزد نمی‌گیریم؛ هزینه فقط مربوط به ابزارها و پلن پلتفرم است.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">۲. برای چه کسانی؟</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>فروشنده‌هایی که تازه می‌خواهند فروش آنلاین را شروع کنند</li>
            <li>کسب‌وکارهایی که به ویترین ساده، سفارش مهمان و پیگیری فاکتور نیاز دارند</li>
            <li>فروشگاه‌هایی که در حال رشد هستند و به آمار، تم، کد تخفیف و امکانات بیشتر نیاز دارند</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">۳. چطور کار می‌کند؟</h2>
          <ol className="list-decimal space-y-2 pr-6">
            <li>حساب فروشنده می‌سازی و فروشگاهت را راه‌اندازی می‌کنی</li>
            <li>محصولات، تصاویر و روش‌های دریافت وجه را اضافه می‌کنی</li>
            <li>خریدار از ویترین عمومی سفارش می‌دهد (حتی بدون ورود، در پلن‌های واجد شرایط)</li>
            <li>وضعیت سفارش را در پنل مدیریت می‌کنی و خریدار می‌تواند فاکتور را پیگیری کند</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">۴. تعهد ما</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>
              <strong>شفافیت تعرفه:</strong> پلن‌ها و امکانات در صفحه قیمت‌ها مشخص است
            </li>
            <li>
              <strong>امنیت داده:</strong> ارتباط امن، نگهداری مسئولانه اطلاعات و رعایت حریم خصوصی
            </li>
            <li>
              <strong>پشتیبانی:</strong> همراهی در راه‌اندازی فروشگاه و رسیدگی به شکایات طبق رویه اعلام‌شده
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-muted/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">آماده شروعی؟</p>
          <p className="mt-1 text-sm text-foreground-muted">با پلن رایگان فروشگاهت را بساز.</p>
        </div>
        <SellerPrimaryCta guestLabel="شروع رایگان" size="md" />
      </div>
    </div>
  );
}
