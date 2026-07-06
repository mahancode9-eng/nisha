import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "رویه رسیدگی به شکایات | Nisha",
  description: "نحوه ثبت شکایت، مراحل رسیدگی و زمان‌بندی پاسخگویی در پلتفرم نیشا",
};

export default function ComplaintsPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">رویه رسیدگی به شکایات</h1>
      <p className="mt-2 text-sm text-foreground-muted">آخرین به‌روزرسانی: تیر ۱۴۰۵</p>
      <div className="mt-8 space-y-8 leading-8">
        <section>
          <h2 className="mb-3 text-xl font-semibold">۱. چه زمانی می‌توانم شکایت ثبت کنم؟</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>سفارش ارسال نشده یا با تاخیر غیرمنطقی مواجه شده است</li>
            <li>کالای دریافتی با توضیحات و تصاویر محصول مغایرت دارد</li>
            <li>کالا معیوب یا آسیب‌دیده تحویل داده شده است</li>
            <li>فروشنده پاسخگوی پیام‌های شما در گفتگوی سفارش نیست</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">۲. چطور شکایت ثبت کنم؟</h2>
          <ol className="list-decimal space-y-2 pr-6">
            <li>
              از طریق صفحهٔ{" "}
              <Link href="/track-order" className="text-brand hover:underline">
                پیگیری سفارش
              </Link>{" "}
              با کد فاکتور و رمز پیگیری وارد حساب خریدار خود شوید
            </li>
            <li>سفارش مورد نظر را باز کنید و گزینهٔ ثبت شکایت را انتخاب کنید</li>
            <li>دلیل شکایت را انتخاب کرده و توضیحات کافی بنویسید</li>
          </ol>
          <p className="mt-3 text-sm text-foreground-muted">
            برای هر سفارش فقط یک شکایت قابل ثبت است؛ در صورت نیاز، توضیحات تکمیلی را از طریق گفتگوی همان سفارش ارسال کنید.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">۳. مراحل و زمان‌بندی رسیدگی</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>
              <strong>باز:</strong> شکایت شما ثبت شده و در صف بررسی تیم پشتیبانی قرار دارد — شروع بررسی حداکثر ظرف ۴۸ ساعت کاری
            </li>
            <li>
              <strong>در حال بررسی:</strong> کارشناس پشتیبانی موضوع را با فروشنده پیگیری می‌کند
            </li>
            <li>
              <strong>حل شده:</strong> نتیجهٔ رسیدگی مشخص شده است — حداکثر ظرف ۷ روز کاری از زمان ثبت شکایت
            </li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold">۴. نتیجهٔ رسیدگی چه می‌تواند باشد؟</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>الزام فروشنده به ارسال کالا، تعویض یا عودت وجه به خریدار</li>
            <li>درج سابقهٔ تخلف برای فروشگاه در سوابق داخلی پلتفرم</li>
            <li>تعلیق موقت یا دائم فروشگاه در صورت تخلف مکرر یا کلاهبرداری</li>
          </ul>
          <p className="mt-3">
            توجه: پرداخت‌ها مستقیماً به حساب فروشنده واریز می‌شود؛ بنابراین عودت وجه توسط فروشنده انجام می‌شود و نیشا روند آن را پیگیری و در صورت عدم همکاری، فروشگاه را تعلیق می‌کند.
          </p>
        </section>
      </div>
    </main>
  );
}
