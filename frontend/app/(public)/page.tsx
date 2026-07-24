import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingStorePreview } from "@/components/landing/LandingStorePreview";
import { Reveal } from "@/components/landing/Reveal";
import { RotatingWords } from "@/components/landing/RotatingWords";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { paths } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "فروشگاه‌ساز نیشا",
  description:
    "در چند دقیقه فروشگاه خود را بسازید، محصول منتشر کنید، سفارش بگیرید و رشد فروشگاه را با آمار زنده دنبال کنید.",
  openGraph: {
    title: "نیشا | فروشگاه‌ساز برای فروشندگان",
    description:
      "در چند دقیقه فروشگاه خود را بسازید، محصول منتشر کنید، سفارش بگیرید و رشد فروشگاه را با آمار زنده دنبال کنید.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "نیشا | فروشگاه‌ساز برای فروشندگان",
    description:
      "در چند دقیقه فروشگاه خود را بسازید، محصول منتشر کنید، سفارش بگیرید و رشد فروشگاه را با آمار زنده دنبال کنید.",
  },
};

const heroWords = ["ویترین اختصاصی", "چک‌اوت بدون ثبت‌نام", "تخفیف و تنوع محصول", "آمار فروش زنده"];

const stats = [
  { value: "۵ دقیقه", label: "تا ساخت فروشگاه و انتشار اولین محصول" },
  { value: "۰ تومان", label: "هزینه شروع — بدون کارمزد پنهان" },
  { value: "۲۴/۷", label: "ویترین همیشه باز، روی موبایل و دسکتاپ" },
];

const capabilities = [
  {
    emoji: "🏬",
    title: "ویترین اختصاصی",
    description: "نام، لوگو و تصویر اصلی را تنظیم کن تا صفحه فروشگاهت حرفه‌ای و قابل‌اعتماد دیده شود.",
  },
  {
    emoji: "🛒",
    title: "چک‌اوت بدون ثبت‌نام",
    description: "مشتری بدون ساخت حساب خرید می‌کند و رسید کارت‌به‌کارت را همان‌جا آپلود می‌کند.",
  },
  {
    emoji: "💬",
    title: "چت با مشتری",
    description: "گفتگوی لحظه‌ای داخل فروشگاه — سوال مشتری همان‌جا جواب می‌گیرد و فروش راحت‌تر بسته می‌شود.",
  },
  {
    emoji: "📊",
    title: "آمار فروش زنده",
    description: "بازدید، فروش روزانه و محصول‌های پرفروش را یک‌جا ببین و تصمیم‌های دقیق‌تر بگیر.",
  },
];

const buyerPoints = [
  {
    emoji: "🧾",
    title: "خرید بدون ثبت‌نام",
    description: "مشتری فقط اسم و شماره می‌دهد، سفارش ثبت می‌شود و رسید پرداخت را همان‌جا آپلود می‌کند.",
  },
  {
    emoji: "🔎",
    title: "پیگیری شفاف سفارش",
    description: "با کد پیگیری و رمز فاکتور، هر لحظه وضعیت سفارش را می‌بیند — بدون تماس و پیگیری دستی.",
  },
  {
    emoji: "💬",
    title: "چت مستقیم با فروشنده",
    description: "سوال درباره سایز و رنگ؟ گفتگو همان‌جا داخل فروشگاه انجام می‌شود.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24 lg:space-y-32">
      <section className="grid gap-12 pt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:pt-10">
        <div className="space-y-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-foreground-muted shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              فروشگاه‌ساز نیشا — برای فروشنده‌های ایرانی
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              فروشگاه آنلاینت را بساز
              <span className="mt-2 block pb-2">
                با{" "}
                <RotatingWords
                  words={heroWords}
                  className="bg-gradient-to-r from-brand via-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
                />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="max-w-2xl text-base leading-8 text-foreground-muted sm:text-lg">
              نیشا مسیر فروش آنلاین را کوتاه می‌کند: ویترین اختصاصی می‌سازی، محصول می‌چینی، سفارش و پرداخت را مدیریت می‌کنی و رشد فروشگاهت را با آمار زنده دنبال می‌کنی.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SellerPrimaryCta size="lg" className="px-6" guestLabel="ساخت فروشگاه رایگان" sellerLabel="رفتن به داشبورد" />
              <Link href={paths.seller.login} className={landingButtonClasses({ variant: "ghost", size: "lg", className: "px-6" })}>
                ورود فروشنده
              </Link>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap gap-3 text-sm text-foreground-muted">
              <span className="rounded-full border border-border bg-surface/70 px-3 py-2">بدون کدنویسی</span>
              <span className="rounded-full border border-border bg-surface/70 px-3 py-2">مناسب موبایل</span>
              <span className="rounded-full border border-border bg-surface/70 px-3 py-2">تم روشن و تاریک</span>
            </div>
          </Reveal>
        </div>

        <Reveal direction="left" delay={200} className="lg:pt-4">
          <LandingStorePreview />
        </Reveal>
      </section>

      <Reveal>
        <section className="grid gap-6 rounded-[2rem] border border-border/70 bg-surface/85 p-6 shadow-sm sm:grid-cols-3 sm:p-8">
          {stats.map((item) => (
            <div key={item.label} className="space-y-2 text-center sm:text-start">
              <p className="bg-gradient-to-r from-brand to-fuchsia-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                {item.value}
              </p>
              <p className="text-sm leading-6 text-foreground-muted">{item.label}</p>
            </div>
          ))}
        </section>
      </Reveal>

      <section className="space-y-10">
        <Reveal>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium tracking-[0.26em] text-brand">چیزی که از روز اول داری</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
              همه‌چیز برای فروش، یک‌جا
            </h2>
            <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
              هر بخش طوری طراحی شده که هم به مشتری اعتماد بدهد، هم کار تو را ساده‌تر کند.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((item, index) => (
            <Reveal key={item.title} delay={index * 100} className="h-full">
              <article className="group h-full rounded-3xl border border-border/70 bg-surface/85 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-lg">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-2xl transition-transform duration-300 group-hover:scale-110">
                  {item.emoji}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{item.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="space-y-10">
        <Reveal>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium tracking-[0.26em] text-brand">چطور کار می‌کند؟</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
              از صفر تا اولین فروش، در ۴ قدم
            </h2>
            <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
              اسکرول کن — هر قدم را با جزئیاتش ببین.
            </p>
          </div>
        </Reveal>

        <HowItWorks />
      </section>

      <section className="space-y-10">
        <Reveal>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium tracking-[0.26em] text-brand">تجربه خرید</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
              برای مشتری‌هایت هم راحت است 🛒
            </h2>
            <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
              خرید بدون ثبت‌نام، پرداخت آشنا و پیگیری شفاف — همان چیزی که مشتری ایرانی دوست دارد.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {buyerPoints.map((item, index) => (
            <Reveal key={item.title} delay={index * 120} className="h-full">
              <div className="h-full rounded-3xl border border-border/70 bg-surface/85 p-6 shadow-sm">
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-foreground-muted">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/90 p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.09),transparent_36%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-medium tracking-[0.26em] text-brand">آماده شروع</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                اولین فروشت از همین‌جا شروع می‌شود
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-foreground-muted sm:text-base">
                ساخت فروشگاه رایگان است؛ همین امروز ویترینت را بساز و لینکش را برای مشتری‌هایت بفرست.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <SellerPrimaryCta size="lg" className="px-6" guestLabel="ساخت فروشگاه رایگان" sellerLabel="رفتن به داشبورد" />
              <Link
                href={paths.seller.login}
                className={landingButtonClasses({ variant: "secondary", size: "lg", className: "px-6" })}
              >
                ورود فروشنده
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
