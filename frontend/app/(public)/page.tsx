import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { DmVersusStore } from "@/components/landing/DmVersusStore";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingMarquee } from "@/components/landing/LandingMarquee";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingScrollProgress } from "@/components/landing/LandingScrollProgress";
import { LandingStorePreview } from "@/components/landing/LandingStorePreview";
import { PaymentFlow } from "@/components/landing/PaymentFlow";
import { Reveal } from "@/components/landing/Reveal";
import { RotatingWords } from "@/components/landing/RotatingWords";
import { SellerPrimaryCta } from "@/components/landing/SellerPrimaryCta";
import { SpotlightGroup } from "@/components/landing/SpotlightGroup";
import { landingButtonClasses } from "@/components/landing/buttonStyles";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";

const metaDescription =
  "فروشگاه بساز، لینکش رو برای مشتری بفرست و با کارت‌به‌کارت بفروش. رایگان شروع کن؛ از سفارش کارمزد نمی‌گیریم.";

export const metadata: Metadata = {
  title: { absolute: "نیشا | فروشگاه‌ساز کارت‌به‌کارت" },
  description: metaDescription,
  openGraph: {
    title: "نیشا | لینک فروشگاهت رو بفرست، کارت‌به‌کارت بگیر",
    description: metaDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "نیشا | فروشگاه‌ساز کارت‌به‌کارت",
    description: metaDescription,
  },
};

const stats = [
  { value: "۵ دقیقه", label: "تا فروشگاهت بالا بیاد" },
  { value: "۰ تومان", label: "شروع؛ کارمزد روی فروش نداریم" },
  { value: "کارت‌به‌کارت", label: "همون واریزی که همه بلدن" },
  { value: "همیشه باز", label: "لینک رو بفرست؛ شب هم سفارش می‌آد" },
];

const svg = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);

const sellerFeatures = [
  {
    icon: svg(<><path d="M3 9.5 5 4h14l2 5.5" /><path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></>),
    title: "فروشگاه به اسم خودت",
    description: "اسم و لوگو رو می‌ذاری، لینک خودت رو می‌گیری، تمام.",
  },
  {
    icon: svg(<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>),
    title: "رسید روی همون سفارش",
    description: "خریدار عکس رسید رو می‌فرسته. تو نگاه می‌کنی و تایید می‌کنی.",
  },
  {
    icon: svg(<><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>),
    title: "چت کنار محصول",
    description: "سایز و رنگ رو همون‌جا جواب می‌دی؛ لازم نیست بری توی دایرکت.",
  },
  {
    icon: svg(<><path d="M9 5h6M8 9h8M7 13h5M5 19l2.5-6h9L19 19" /></>),
    title: "پیگیری با کد فاکتور",
    description: "خریدار خودش وضعیت رو می‌بینه. هی نپرسه «سفارشم کجاست؟».",
  },
  {
    icon: svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
    title: "خرید بدون ثبت‌نام",
    description: "اسم و شماره تلفن کافیه. حتی روی پلن رایگان.",
  },
  {
    icon: svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
    title: "آمار فروش",
    description: "می‌بینی امروز چند نفر اومدن و چی بیشتر فروش رفت.",
  },
];

/** Common DM questions — keep lengths close so the hero slot stays tidy. */
const dmQuestions = ["قیمت؟", "موجوده؟", "کارت؟", "آدرس؟", "کی میاد؟"];

const buyerPoints = [
  {
    title: "کارت‌به‌کارت",
    description: "واریز به کارت تو، فرستادن رسید. درگاه لازم نیست.",
  },
  {
    title: "سفارش سریع",
    description: "اسم و شماره تلفن کافیه. حساب نمی‌خواد.",
  },
  {
    title: "پیگیری سفارش",
    description: "با کد و رمز فاکتور، هر وقت خواستن وضعیت رو می‌بینن.",
  },
];

function LandingSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-6xl scroll-mt-20 px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <LandingScrollProgress />
      <div className="space-y-24 lg:space-y-32">
        <LandingSection className="pt-4 sm:pt-8 lg:pt-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="landing-enter" style={{ animationDelay: "0ms" }}>
              <p className="landing-display text-4xl text-white sm:text-5xl lg:text-6xl">نیشا</p>
            </div>

            <div className="landing-enter mt-3" style={{ animationDelay: "70ms" }}>
              <h1 className="landing-display mx-auto flex max-w-xl flex-col items-center gap-2 text-center text-2xl leading-snug text-white sm:max-w-2xl sm:gap-2.5 sm:text-3xl sm:leading-snug lg:text-4xl lg:leading-snug">
                <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
                  <span>دیگه به</span>
                  <span className="inline-flex min-h-[1.35em] items-center rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-0.5">
                    <RotatingWords
                      words={dmQuestions}
                      className="font-semibold text-violet-200"
                    />
                  </span>
                  <span>جواب نده</span>
                </span>
                <span className="text-zinc-100">لینک فروشگاهت رو بفرست.</span>
              </h1>
            </div>

            <div className="landing-enter mt-4" style={{ animationDelay: "140ms" }}>
              <p className="mx-auto max-w-xl text-pretty text-sm leading-7 text-zinc-400 sm:max-w-2xl sm:text-base sm:leading-8">
                قیمت و موجودی روی صفحه محصوله. مشتری سفارش می‌ده، به کارت تو می‌زنه، رسید رو
                می‌فرسته. تو فقط تایید می‌کنی.
              </p>
            </div>

            <div
              className="landing-enter mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "200ms" }}
            >
              <SellerPrimaryCta
                size="lg"
                className="landing-shine min-w-[11rem] px-6"
                guestLabel="فروشگاه رایگان بساز"
                sellerLabel="برو داشبورد"
              />
              <Link
                href={paths.seller.login}
                className={landingButtonClasses({
                  variant: "secondary",
                  size: "lg",
                  className: "min-w-[11rem] px-6",
                })}
              >
                ورود فروشنده
              </Link>
            </div>

            <p className="landing-enter mt-3 text-sm text-zinc-500" style={{ animationDelay: "260ms" }}>
              درگاه لازم نیست. از فروش هم کارمزد نمی‌گیریم.
            </p>
          </div>

          <div className="landing-preview-enter relative mt-8 sm:mt-12">
            <div className="pointer-events-none absolute inset-x-8 -top-10 h-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.28),transparent_70%)]" />
            <LandingStorePreview />
            <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
              <div className="landing-glass absolute -start-8 bottom-[10%] flex items-center gap-2 px-3 py-2 text-xs text-white">
                <span className="text-base font-bold text-emerald-300">۰٪</span>
                کارمزد روی فروش
              </div>
              <div className="landing-glass absolute -end-8 top-[42%] flex items-center gap-2 px-3 py-2 text-xs text-white">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                بدون درگاه
              </div>
            </div>
          </div>
        </LandingSection>

        <LandingSection>
          <LandingMarquee />
        </LandingSection>

        <LandingSection>
          <Reveal>
            <div className="landing-surface grid gap-6 px-4 py-6 sm:grid-cols-2 sm:px-6 sm:py-8 lg:grid-cols-4 lg:divide-x lg:divide-x-reverse lg:divide-white/10">
              {stats.map((item, index) => (
                <Reveal
                  key={item.label}
                  delay={150 + index * 110}
                  className={cn(
                    "space-y-2 px-1 text-center lg:px-5 lg:text-start",
                    index === 0 && "lg:ps-0",
                    index === stats.length - 1 && "lg:pe-0",
                  )}
                >
                  <p className="bg-gradient-to-l from-white to-violet-200 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
                    {item.value}
                  </p>
                  <p className="text-sm leading-6 text-zinc-400">{item.label}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </LandingSection>

        <LandingSection id="story">
          <DmVersusStore />
        </LandingSection>

        <LandingSection id="features">
          <div className="space-y-10">
            <Reveal>
              <div className="mx-auto max-w-2xl space-y-3 text-center">
                <p className="landing-eyebrow">پنل فروشنده</p>
                <h2 className="landing-display text-3xl text-white sm:text-4xl lg:text-5xl">
                  داخل پنل چی داری
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                  همون چیزایی که برای فروش روزمره لازم داری.
                </p>
              </div>
            </Reveal>

            <SpotlightGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sellerFeatures.map((item, index) => (
                <Reveal key={item.title} delay={(index % 3) * 70} className="h-full">
                  <article className="landing-surface landing-spotlight group h-full p-6 hover:border-violet-400/30 sm:p-7">
                    <div className="landing-icon mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300 transition-colors group-hover:border-violet-400/40 group-hover:bg-violet-500/15 group-hover:text-violet-100">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description}</p>
                  </article>
                </Reveal>
              ))}
            </SpotlightGroup>
          </div>
        </LandingSection>

        <LandingSection id="how">
          <div className="space-y-10">
            <Reveal>
              <div className="mx-auto max-w-2xl space-y-3 text-center">
                <p className="landing-eyebrow">چطور کار می‌کنه؟</p>
                <h2 className="landing-display text-3xl text-white sm:text-4xl lg:text-5xl">
                  از ساخت فروشگاه تا اولین فروش
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                  چهار تا کار ساده.
                </p>
              </div>
            </Reveal>
            <HowItWorks />
          </div>
        </LandingSection>

        <LandingSection id="pricing">
          <LandingPricing className="landing-pricing" />
        </LandingSection>

        <LandingSection>
          <div className="space-y-10">
            <Reveal>
              <div className="mx-auto max-w-2xl space-y-3 text-center">
                <p className="landing-eyebrow">برای مشتری‌هات</p>
                <h2 className="landing-display text-3xl text-white sm:text-4xl lg:text-5xl">
                  خرید مثل همیشه
                </h2>
                <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                  کارت‌به‌کارت، سفارش سریع، پیگیری روشن. همون چیزی که مشتری بلده.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <PaymentFlow />
            </Reveal>

            <SpotlightGroup className="grid gap-4 md:grid-cols-3">
              {buyerPoints.map((item, index) => (
                <Reveal key={item.title} delay={index * 70} className="h-full">
                  <div className="landing-surface landing-spotlight h-full p-6 hover:border-violet-400/30">
                    <div className="mb-4 h-px w-10 bg-gradient-to-l from-violet-400 to-transparent" />
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </SpotlightGroup>
          </div>
        </LandingSection>

        <LandingSection id="faq">
          <LandingFaq />
        </LandingSection>

        <LandingSection>
          <Reveal>
            <section className="landing-glow-ring landing-border-spin relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-[#111113] to-[#09090b] p-8 sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute -end-10 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/15" />
              <div className="relative mx-auto max-w-2xl space-y-6 text-center">
                <p className="landing-eyebrow">شروع کن</p>
                <h2 className="landing-display text-3xl text-white sm:text-4xl">
                  امروز بساز، لینک رو تو بیو بذار.
                </h2>
                <p className="text-sm leading-7 text-zinc-400 sm:text-base">
                  رایگانه. بعداً اگر لازم شد، پلن رو عوض می‌کنی.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <SellerPrimaryCta
                    size="lg"
                    className="landing-shine min-w-[11rem] px-6"
                    guestLabel="فروشگاه رایگان بساز"
                    sellerLabel="برو داشبورد"
                  />
                  <Link
                    href={paths.seller.login}
                    className={landingButtonClasses({
                      variant: "secondary",
                      size: "lg",
                      className: "min-w-[11rem] px-6",
                    })}
                  >
                    ورود فروشنده
                  </Link>
                </div>
              </div>
            </section>
          </Reveal>
        </LandingSection>
      </div>
    </>
  );
}
