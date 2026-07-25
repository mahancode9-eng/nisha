import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingStorePreview } from "@/components/landing/LandingStorePreview";
import { Reveal } from "@/components/landing/Reveal";
import { RotatingWords } from "@/components/landing/RotatingWords";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { paths } from "@/lib/auth/paths";

const metaDescription =
  "فروشگاه آنلاینت را رایگان بساز، با کارت‌به‌کارت فروش کن و روی هر سفارش کارمزد نده — ساده و کم‌هزینه برای فروشنده‌های ایرانی.";

export const metadata: Metadata = {
  title: "نیشا | فروشگاه‌ساز کارت‌به‌کارت",
  description: metaDescription,
  openGraph: {
    title: "نیشا | فروشگاه بساز، کارت‌به‌کارت بفروش",
    description: metaDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "نیشا | فروشگاه‌ساز کارت‌به‌کارت",
    description: metaDescription,
  },
};

const heroWords = ["کارت‌به‌کارت", "بدون کارمزد فروش", "شروع رایگان", "ویترین قشنگ"];

const stats = [
  { value: "۵ دقیقه", label: "تا ساخت فروشگاه و گذاشتن اولین محصول" },
  { value: "۰ تومان", label: "شروع رایگان — روی فروش کارمزد نمی‌گیریم" },
  { value: "کارت‌به‌کارت", label: "پرداخت آشنا برای مشتری؛ بدون درگاه گران" },
];

const capabilities = [
  {
    emoji: "🏬",
    title: "ویترین خودت",
    description: "اسم، لوگو و کاور را بگذار تا فروشگاهت جدی و قابل‌اعتماد دیده شود.",
  },
  {
    emoji: "💳",
    title: "فروش با کارت‌به‌کارت",
    description:
      "مشتری خرید می‌کند، به کارت تو واریز می‌کند و رسید را همان‌جا می‌فرستد. تو فقط تایید می‌کنی — بدون کارمزد روی هر سفارش.",
  },
  {
    emoji: "💬",
    title: "چت با مشتری",
    description: "سوال سایز و رنگ؟ همان‌جا داخل فروشگاه جواب بده تا فروش راحت‌تر بسته شود.",
  },
  {
    emoji: "📊",
    title: "آمار فروش",
    description: "بازدید و فروش روزانه را از روز اول ببین تا بدانی چه چیزی بهتر می‌فروشد.",
  },
];

const buyerPoints = [
  {
    emoji: "💳",
    title: "پرداخت کارت‌به‌کارت",
    description: "همان روشی که همه بلدند: واریز به کارت و آپلود رسید — بدون سردرگمی درگاه.",
  },
  {
    emoji: "🧾",
    title: "خرید سریع",
    description: "اسم و شماره کافی است؛ نیازی به ساخت حساب طولانی نیست.",
  },
  {
    emoji: "🔎",
    title: "پیگیری سفارش",
    description: "با کد و رمز فاکتور، وضعیت سفارش را هر وقت بخواهد می‌بیند.",
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
              برای فروشنده‌های ایرانی که می‌خواهند ساده بفروشند
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
              ویترینت را بالا بیاور، محصول بگذار و با کارت‌به‌کارت سفارش بگیر. روی فروش کارمزد
              نمی‌گیریم — فقط وقتی لازم شد، برای ابزارهای بیشتر اشتراک بگیر.
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
              <span className="rounded-full border border-border bg-surface/70 px-3 py-2">کارت‌به‌کارت</span>
              <span className="rounded-full border border-border bg-surface/70 px-3 py-2">بدون کارمزد فروش</span>
              <span className="rounded-full border border-border bg-surface/70 px-3 py-2">شروع رایگان</span>
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
            <p className="text-sm font-medium tracking-[0.26em] text-brand">چرا نیشا؟</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
              فروش ساده، هزینه کم
            </h2>
            <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
              همان چیزهایی که برای فروش روزمره لازم داری — بدون پیچیدگی اضافه.
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
        <p className="text-center text-xs text-foreground-muted sm:text-sm">
          خرید مهمان و بعضی ابزارهای پیشرفته از پلن پایه به بعد فعال می‌شوند.
        </p>
      </section>

      <section className="space-y-10">
        <Reveal>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium tracking-[0.26em] text-brand">چطور کار می‌کند؟</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
              از صفر تا اولین فروش، در ۴ قدم
            </h2>
            <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
              کوتاه و واضح — هر قدم را پایین ببین.
            </p>
          </div>
        </Reveal>

        <HowItWorks />
      </section>

      <LandingPricing />

      <section className="space-y-10">
        <Reveal>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium tracking-[0.26em] text-brand">برای مشتری‌هایت</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-5xl">
              خرید آشنا و بی‌دردسر
            </h2>
            <p className="max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
              کارت‌به‌کارت، سفارش سریع و پیگیری شفاف — همان چیزی که مشتری ایرانی راحت است.
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
              <p className="text-sm font-medium tracking-[0.26em] text-brand">بیا شروع کنیم</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                امروز ویترینت را بساز، فردا بفروش
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-foreground-muted sm:text-base">
                رایگان شروع کن، لینک فروشگاهت را برای مشتری بفرست و با کارت‌به‌کارت فروش بگیر — بدون
                کارمزد روی هر سفارش.
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
