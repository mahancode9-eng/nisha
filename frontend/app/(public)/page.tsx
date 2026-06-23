import type { Metadata } from "next";
import Link from "next/link";
import { LandingMockup } from "@/components/landing/LandingMockup";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { paths } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "فروشگاه‌ساز مدرن برای فروشندگان",
  description:
    "فروشگاه اختصاصی بسازید، اولین محصول را سریع منتشر کنید، سفارش‌ها را مدیریت کنید و با مشتری‌ها در یک تجربه ساده و مدرن در ارتباط بمانید.",
  openGraph: {
    title: "نیشا | فروشگاه‌ساز مدرن برای فروشندگان",
    description:
      "فروشگاه اختصاصی بسازید، اولین محصول را سریع منتشر کنید، سفارش‌ها را مدیریت کنید و با مشتری‌ها در یک تجربه ساده و مدرن در ارتباط بمانید.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "نیشا | فروشگاه‌ساز مدرن برای فروشندگان",
    description:
      "فروشگاه اختصاصی بسازید، اولین محصول را سریع منتشر کنید، سفارش‌ها را مدیریت کنید و با مشتری‌ها در یک تجربه ساده و مدرن در ارتباط بمانید.",
  },
};

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
      <path d="M4 10.5V19a1 1 0 001 1h14a1 1 0 001-1v-8.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 7.5h17L19 3H5L3.5 7.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-6h5v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
      <path d="M7 7h11l-1 10H8L7 7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 016 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10h8" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
      <path d="M4 5.5h16v10H9l-5 3v-3.2V5.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h5" strokeLinecap="round" />
    </svg>
  );
}

function InsightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
      <path d="M4 19h16" strokeLinecap="round" />
      <path d="M7 17V9" strokeLinecap="round" />
      <path d="M12 17V5" strokeLinecap="round" />
      <path d="M17 17v-6" strokeLinecap="round" />
      <path d="M6.5 11.5l2.4-2.6 3 2.1 4.7-4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const capabilities = [
  {
    title: "فروشگاه اختصاصی",
    description: "نام، لوگو و هویت فروشگاه را تمیز و حرفه‌ای تنظیم کنید.",
    icon: StoreIcon,
  },
  {
    title: "مدیریت سفارش‌ها",
    description: "سفارش‌ها را در یک مسیر واضح ببینید و سریع‌تر پیگیری کنید.",
    icon: OrdersIcon,
  },
  {
    title: "گفتگو با مشتری",
    description: "با خریداران از طریق کانال‌های ارتباطی دلخواه در تماس بمانید.",
    icon: ChatIcon,
  },
  {
    title: "اعتماد و آمار",
    description: "نظرات تاییدشده، نشان‌های اعتماد و داده‌های کلیدی فروش را یک‌جا دنبال کنید.",
    icon: InsightIcon,
  },
];

const activationSteps = [
  {
    title: "فروشگاه را برند کنید",
    description: "نام، لوگو و تصویر کاور را اضافه کنید تا فروشگاه حرفه‌ای‌تر دیده شود.",
  },
  {
    title: "اطلاعات را کامل کنید",
    description: "دسته‌بندی، توضیح و راه‌های ارتباطی را تکمیل کنید تا اعتماد بیشتری بسازید.",
  },
  {
    title: "اولین محصول را منتشر کنید",
    description: "یک محصول ساده اضافه کنید و همان لحظه آماده فروش شوید.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24 lg:space-y-28">
      <section className="grid gap-14 pt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:pt-10">
        <div className="space-y-8">
          <div
            className="animate-reveal-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm font-medium text-foreground-muted shadow-sm"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_0_6px_rgba(124,58,237,0.12)]" />
            ویژه فروشندگان
          </div>

          <div className="space-y-4 animate-reveal-up" style={{ animationDelay: "100ms" }}>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-7xl">
              فروشگاه خود را بسازید
              <span className="block bg-gradient-to-r from-brand via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                و سریع‌تر به فروش برسید
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-foreground-muted sm:text-lg">
              نیشا مسیر ساخت فروشگاه، افزودن محصول، پاسخ به مشتری و مدیریت سفارش‌ها را ساده، مدرن و مناسب موبایل
              می‌کند.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row animate-reveal-up" style={{ animationDelay: "180ms" }}>
            <SellerPrimaryCta size="lg" className="px-6" guestLabel="شروع فروش" sellerLabel="رفتن به داشبورد" />
            <Link
              href={paths.seller.login}
              className={landingButtonClasses({ variant: "ghost", size: "lg", className: "px-6" })}
            >
              ورود فروشنده
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-foreground-muted animate-reveal-up" style={{ animationDelay: "260ms" }}>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-2">مناسب موبایل</span>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-2">سبک و سریع</span>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-2">قابل ادامه بعداً</span>
          </div>
        </div>

        <div className="animate-reveal-up" style={{ animationDelay: "140ms" }}>
          <LandingMockup />
        </div>
      </section>

      <section className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium tracking-[0.26em] text-brand">قابلیت‌ها</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
            همه چیز برای شروع فروش
          </h2>
          <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
            یک مسیر یکپارچه برای ساخت فروشگاه، ارتباط با خریدار و رشد اعتماد.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="animate-reveal-up group rounded-3xl border border-border/70 bg-surface/85 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Icon />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="rounded-[2rem] border border-border/70 bg-surface/85 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium tracking-[0.26em] text-brand">مسیر فعال‌سازی</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            راه‌اندازی را مرحله‌به‌مرحله پیش ببرید
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
            بعد از ثبت‌نام، مسیر شما روشن است: فروشگاه، اطلاعات و اولین محصول. هر مرحله سبک و قابل ادامه دادن است.
          </p>

          <div className="mt-8 space-y-4">
            {activationSteps.map((step, index) => (
              <div
                key={step.title}
                className="animate-reveal-up flex gap-4 rounded-2xl border border-border/70 bg-background/60 p-4"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-sm font-semibold text-brand-foreground">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-brand/15 bg-[linear-gradient(180deg,rgba(124,58,237,0.08),rgba(255,255,255,0.75))] p-6 shadow-sm dark:bg-[linear-gradient(180deg,rgba(124,58,237,0.14),rgba(15,23,42,0.9))] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.24em] text-foreground-muted">پیشرفت راه‌اندازی</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">۳ قدم تا فعال شدن</h3>
            </div>
            <div className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
              قابل ادامه بعداً
            </div>
          </div>

          <div className="relative mt-6 space-y-4">
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-brand to-fuchsia-500" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {["نام و لوگو", "اولین محصول", "اعتماد و ارتباط"].map((label, index) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-surface px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium tracking-[0.18em] text-foreground-muted">گام {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-surface p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground">هر چیز مهم، در یک جای ساده</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground-muted">
                <li>تنظیمات فروشگاه</li>
                <li>کانال‌های ارتباطی</li>
                <li>اولین محصول</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-surface/90 p-8 shadow-sm sm:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.09),transparent_36%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-medium tracking-[0.26em] text-brand">شروع نهایی</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              فروشگاه شما آماده شروع است
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-foreground-muted sm:text-base">
              با یک تجربه کوتاه و روشن، فروشگاه را فعال کنید، اولین محصول را اضافه کنید و بعداً جزئیات را تکمیل
              کنید.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-foreground-muted">
              <span className="rounded-full border border-border bg-background px-3 py-2">مناسب موبایل</span>
              <span className="rounded-full border border-border bg-background px-3 py-2">سبک و سریع</span>
              <span className="rounded-full border border-border bg-background px-3 py-2">بدون پیچیدگی</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <SellerPrimaryCta size="lg" className="px-6" guestLabel="شروع فروش" sellerLabel="رفتن به داشبورد" />
            <Link
              href={paths.seller.login}
              className={landingButtonClasses({ variant: "secondary", size: "lg", className: "px-6" })}
            >
              ورود فروشنده
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
