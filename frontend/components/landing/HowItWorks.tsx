"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/components/landing/useInView";

type Step = {
  title: string;
  description: string;
  highlights: string[];
  caption: string;
};

const STEPS: Step[] = [
  {
    title: "فروشگاهت رو بساز",
    description: "اسم و لوگو رو می‌ذاری، لینک خودت رو می‌گیری. کد نویسی لازم نیست.",
    highlights: ["لینک خودت", "لوگو و کاور", "شروع رایگان"],
    caption: "ساخت فروشگاه",
  },
  {
    title: "محصول بذار",
    description: "عکس، قیمت و موجودی. اگر خواستی کد تخفیف هم بساز.",
    highlights: ["عکس محصول", "رنگ و سایز", "کد تخفیف"],
    caption: "اضافه کردن محصول",
  },
  {
    title: "کارت‌به‌کارت بگیر",
    description: "مشتری واریز می‌کنه، رسید رو می‌فرسته. تو تایید می‌کنی. کارمزد نداریم.",
    highlights: ["کارت‌به‌کارت", "رسید", "چت"],
    caption: "تایید پرداخت",
  },
  {
    title: "ببین چی فروش می‌ره",
    description: "هر روز چند نفر اومدن و کدوم محصول بیشتر رفت، تو داشبورده.",
    highlights: ["بازدید", "فروش", "اعلان سفارش"],
    caption: "داشبورد فروش",
  },
];

const LAST = STEPS.length - 1;

/* ---------- Phone screens ---------- */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[9px] font-medium text-zinc-300">
      <span>۹:۴۱</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-3 rounded-sm border border-current opacity-70" />
        <span className="h-2 w-1 rounded-sm bg-current opacity-80" />
      </span>
    </div>
  );
}

function ScreenShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex h-full flex-col bg-[#0c0c10] text-white">
      <StatusBar />
      <div className="border-b border-white/10 px-3 pb-2.5 pt-3">
        <p className="text-center text-[11px] font-semibold">{title}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-3">{children}</div>
    </div>
  );
}

function ScreenBuildStore() {
  return (
    <ScreenShell title="فروشگاه جدید">
      <div className="space-y-3">
        <div className="relative h-16 overflow-hidden rounded-xl bg-gradient-to-l from-violet-600/50 via-fuchsia-600/30 to-sky-500/20">
          <div className="absolute -bottom-5 start-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#0c0c10] bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-bold">
            آ
          </div>
        </div>
        <div className="h-3" />
        <label className="block space-y-1">
          <span className="text-[10px] text-zinc-500">اسم فروشگاه</span>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px]">آتیه استور</div>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] text-zinc-500">لینک فروشگاه</span>
          <div className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-2 text-[11px] text-violet-100" dir="ltr">
            atieh.nishaapp.ir
          </div>
        </label>
        <div className="rounded-xl bg-brand px-3 py-2.5 text-center text-[11px] font-semibold text-brand-foreground">
          فروشگاه رو بساز
        </div>
      </div>
    </ScreenShell>
  );
}

function ScreenAddProduct() {
  return (
    <ScreenShell title="محصول جدید">
      <div className="space-y-3">
        <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-[#7a4a2e] to-[#3a2416]">
          <div className="absolute inset-x-6 bottom-4 top-6 rounded-t-[2rem] rounded-b-lg border-2 border-[#c08a5e]/60 bg-[#8b5a3a]" />
          <div className="absolute inset-x-[38%] top-3 h-6 rounded-t-full border-2 border-b-0 border-[#c08a5e]/70" />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px]">کیف چرمی</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] tabular-nums">۱٬۱۹۰٬۰۰۰</div>
          <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-2 text-[11px] text-emerald-200">موجود</div>
        </div>
        <div className="flex gap-1.5">
          {[
            { tone: "مشکی", color: "#1b1b1f" },
            { tone: "قهوه‌ای", color: "#7a4a2e" },
          ].map((item) => (
            <span key={item.tone} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-zinc-300">
              <span className="h-2 w-2 rounded-full ring-1 ring-white/30" style={{ backgroundColor: item.color }} />
              {item.tone}
            </span>
          ))}
        </div>
        <div className="rounded-xl bg-brand px-3 py-2.5 text-center text-[11px] font-semibold text-brand-foreground">
          ذخیره محصول
        </div>
      </div>
    </ScreenShell>
  );
}

function ScreenPayment() {
  return (
    <ScreenShell title="سفارش #۱۲۴">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium">کیف چرمی</p>
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] text-amber-200">در انتظار</span>
          </div>
          <p className="mt-2 text-sm font-semibold tabular-nums">۱٬۱۹۰٬۰۰۰ تومان</p>
          <p className="mt-1 text-[10px] text-zinc-500" dir="ltr">
            ۶۰۳۷ •••• ۴۲۱۸
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 p-2.5">
          <div className="flex h-12 w-10 shrink-0 flex-col justify-center gap-1 rounded-md bg-[#f4f4f5] px-1.5">
            <span className="h-0.5 rounded bg-zinc-300" />
            <span className="h-0.5 w-2/3 rounded bg-zinc-300" />
            <span className="h-1 rounded bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium">عکس واریز اومد</p>
            <p className="text-[10px] text-zinc-500">الان می‌تونی تایید کنی</p>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-500 px-3 py-2.5 text-center text-[11px] font-semibold text-white">
          تایید پرداخت
        </div>
      </div>
    </ScreenShell>
  );
}

function ScreenDashboard() {
  const bars = [40, 65, 48, 80, 56, 92, 70];
  return (
    <ScreenShell title="داشبورد">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "سفارش امروز", value: "۱۲" },
            { label: "فروش ماه", value: "۴۸م" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2.5">
              <p className="text-base font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-0.5 text-[9px] text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          <p className="mb-2 text-[10px] text-zinc-500">فروش این هفته</p>
          <div className="flex h-16 items-end gap-1.5">
            {bars.map((height, index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-sm",
                  index === bars.length - 1 ? "bg-gradient-to-t from-violet-500 to-fuchsia-400" : "bg-white/15",
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-2.5 py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400" />
          <p className="text-[10px] text-violet-100">سفارش تازه · کیف چرمی</p>
        </div>
      </div>
    </ScreenShell>
  );
}

const SCREENS = [ScreenBuildStore, ScreenAddProduct, ScreenPayment, ScreenDashboard];

/* ---------- Cards that float in front of the phone, one set per step ---------- */

function PopCards({ active }: { active: number }) {
  const card =
    "how-pop absolute rounded-2xl border border-white/15 bg-[#17151f]/95 px-3.5 py-2.5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.5)]";
  return (
    <>
      <div className={card} data-on={active === 0} style={{ "--z": "90px", top: "16%", insetInlineStart: "-34%" } as CSSProperties}>
        <p className="text-[10px] text-zinc-400">لینک فروشگاهت</p>
        <p className="mt-0.5 text-xs font-semibold text-violet-200" dir="ltr">
          atieh.nishaapp.ir
        </p>
      </div>
      <div className={card} data-on={active === 0} style={{ "--z": "60px", bottom: "20%", insetInlineEnd: "-26%" } as CSSProperties}>
        <p className="text-xs font-semibold">
          <span className="text-emerald-300">۰ تومان</span> برای شروع
        </p>
      </div>

      <div className={card} data-on={active === 1} style={{ "--z": "100px", top: "24%", insetInlineEnd: "-30%" } as CSSProperties}>
        <p className="text-[10px] text-zinc-400">قیمت</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums">۱٬۱۹۰٬۰۰۰ تومان</p>
      </div>
      <div className={card} data-on={active === 1} style={{ "--z": "70px", bottom: "26%", insetInlineStart: "-28%" } as CSSProperties}>
        <p className="flex items-center gap-2 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          ۸ عدد موجود
        </p>
      </div>

      <div className={card} data-on={active === 2} style={{ "--z": "110px", top: "30%", insetInlineStart: "-36%" } as CSSProperties}>
        <p className="text-[10px] text-zinc-400">رسید کارت‌به‌کارت</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums">۱٬۱۹۰٬۰۰۰ تومان</p>
        <p className="mt-1 text-[10px] text-zinc-500">کد پیگیری ۴۸۲۹۱۷</p>
      </div>
      <div className={card} data-on={active === 2} style={{ "--z": "70px", bottom: "16%", insetInlineEnd: "-24%" } as CSSProperties}>
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          کارمزد: صفر
        </p>
      </div>

      <div className={card} data-on={active === 3} style={{ "--z": "110px", top: "10%", insetInlineEnd: "-32%" } as CSSProperties}>
        <p className="flex items-center gap-2 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
          سفارش تازه
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-400">کیف چرمی · همین الان</p>
      </div>
      <div className={card} data-on={active === 3} style={{ "--z": "80px", bottom: "22%", insetInlineStart: "-30%" } as CSSProperties}>
        <p className="text-[10px] text-zinc-400">فروش این هفته</p>
        <p className="mt-0.5 text-sm font-bold text-emerald-300">۲۴٪ بیشتر</p>
      </div>
    </>
  );
}

/* ---------- The 3D phone ---------- */

// Stacked slabs behind the front face give the body real thickness when it turns.
const EDGE_LAYERS = 12;

function Phone3D({ active }: { active: number }) {
  return (
    <div className="how-phone relative mx-auto h-[460px] w-[236px]">
      {Array.from({ length: EDGE_LAYERS }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="how-phone-edge absolute inset-0 rounded-[2.6rem]"
          style={{ "--d": `${-(i + 1)}px` } as CSSProperties}
        />
      ))}

      {/* Side buttons sit on the edge. */}
      <span aria-hidden className="how-phone-button absolute -start-[3px] top-[22%] h-12 w-[4px] rounded-full" />
      <span aria-hidden className="how-phone-button absolute -end-[3px] top-[18%] h-8 w-[4px] rounded-full" />
      <span aria-hidden className="how-phone-button absolute -end-[3px] top-[28%] h-14 w-[4px] rounded-full" />

      <div className="how-phone-face absolute inset-0 rounded-[2.6rem] p-[10px]">
        <div className="relative h-full overflow-hidden rounded-[2.05rem] bg-black">
          <div className="absolute inset-x-[30%] top-[10px] z-20 h-[20px] rounded-full bg-black ring-1 ring-white/5" />
          {SCREENS.map((Screen, index) => (
            <div
              key={STEPS[index].title}
              aria-hidden={active !== index}
              className={cn(
                "absolute inset-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                active === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
              )}
            >
              <Screen />
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center">
            <span className="h-1 w-24 rounded-full bg-white/30" />
          </div>
          <div aria-hidden className="how-phone-glare pointer-events-none absolute inset-0 z-30" />
        </div>
      </div>

      <PopCards active={active} />
    </div>
  );
}

// Mobile: one phone, step cards in a swipeable row under it. Swiping turns the phone.
function MobileHow() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.card));
        }
      },
      { root: track, threshold: 0.6 },
    );
    Array.from(track.children).forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const go = (index: number) => {
    const card = trackRef.current?.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest", inline: "center" });
  };

  return (
    <div className="min-w-0 overflow-x-clip lg:hidden">
      <button
        type="button"
        aria-label="قدم بعد"
        onClick={() => go((active + 1) % STEPS.length)}
        className="how-stage how-stage-m relative mx-auto -my-[46px] flex w-full scale-[0.8] justify-center"
        style={{ "--how-p": active } as CSSProperties}
      >
        <div aria-hidden className="how-glow pointer-events-none absolute inset-x-0 top-10 h-[420px]" />
        <Phone3D active={active} />
      </button>

      <div className="mt-2 flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <button
            key={step.title}
            type="button"
            aria-label={step.title}
            onClick={() => go(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none",
              active === index ? "w-8 bg-brand" : "w-3 bg-white/15",
            )}
          />
        ))}
      </div>

      <div
        ref={trackRef}
        className="-mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[8%] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((step, index) => {
          const on = active === index;
          return (
            <div
              key={step.title}
              data-card={index}
              className={cn(
                "w-[84%] shrink-0 snap-center rounded-2xl border p-5 transition-[border-color,background-color,opacity] duration-500 motion-reduce:transition-none",
                on ? "border-violet-400/35 bg-violet-500/[0.09]" : "border-white/10 bg-white/[0.025] opacity-60",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-500",
                    on ? "bg-brand text-brand-foreground" : "bg-white/10 text-foreground-muted",
                  )}
                >
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <span className="text-lg font-semibold text-foreground">{step.title}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-foreground-muted">{step.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {step.highlights.map((item) => (
                  <span key={item} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground-muted">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">برای قدم بعد بکش یا روی گوشی بزن</p>
    </div>
  );
}

/* ---------- Section ---------- */

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step-index]"));
    const still = prefersReducedMotion();
    let frame = 0;
    let running = false;

    // Continuous progress 0…LAST from where the viewport centre sits between step centres.
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      const centres = steps.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      let p = 0;
      if (mid >= centres[LAST]) p = LAST;
      else if (mid > centres[0]) {
        for (let i = 0; i < LAST; i++) {
          if (mid <= centres[i + 1]) {
            p = i + (mid - centres[i]) / (centres[i + 1] - centres[i]);
            break;
          }
        }
      }
      root.style.setProperty("--how-p", p.toFixed(3));
      if (!still) stage.style.setProperty("--how-p", p.toFixed(3));
      const next = Math.round(p);
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    };

    const onScroll = () => {
      if (!running || frame) return;
      frame = requestAnimationFrame(update);
    };

    // Only track scroll while the section is near the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) update();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToStep = (index: number) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-step-index="${index}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + r.top + r.height / 2 - window.innerHeight / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <div ref={rootRef} className="how-root grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <MobileHow />
      <ol className="relative hidden lg:block">
        {/* Progress rail, filled continuously by --how-p. */}
        <span aria-hidden className="absolute bottom-[12%] start-[22px] top-[12%] hidden w-px bg-white/10 lg:block" />
        <span aria-hidden className="how-rail absolute start-[22px] top-[12%] hidden w-px lg:block" />

        {STEPS.map((step, index) => {
          const on = active === index;
          return (
            <li key={step.title} data-step-index={index} className="lg:flex lg:min-h-[62vh] lg:items-center">
              <button
                type="button"
                onClick={() => scrollToStep(index)}
                className={cn(
                  "relative w-full rounded-2xl border p-6 text-start transition-[border-color,background-color,opacity,transform] duration-500 motion-reduce:transition-none sm:p-7 lg:ms-12 lg:w-[calc(100%-3rem)]",
                  on
                    ? "border-violet-400/35 bg-violet-500/[0.09] shadow-[0_20px_50px_rgba(0,0,0,0.35)] lg:translate-x-0"
                    : "border-white/10 bg-white/[0.025] lg:opacity-50",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 transition-colors duration-500 lg:block",
                    "-start-[31px]",
                    on ? "border-fuchsia-300 bg-violet-500 shadow-[0_0_14px_rgba(192,132,252,0.9)]" : "border-white/20 bg-[#0c0c0f]",
                  )}
                />
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-500",
                      on ? "bg-brand text-brand-foreground" : "bg-white/10 text-foreground-muted",
                    )}
                  >
                    {(index + 1).toLocaleString("fa-IR")}
                  </span>
                  <span className="text-lg font-semibold text-foreground sm:text-xl">{step.title}</span>
                </div>
                <span className="mt-4 block text-sm leading-7 text-foreground-muted sm:text-base">{step.description}</span>
                <span className="mt-4 flex flex-wrap gap-2">
                  {step.highlights.map((item) => (
                    <span key={item} className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground-muted">
                      {item}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[max(5.5rem,calc(50vh-300px))]">
          <div ref={stageRef} className="how-stage relative flex flex-col items-center py-6">
            <div aria-hidden className="how-glow pointer-events-none absolute inset-x-0 top-10 h-[420px]" />
            <Phone3D active={active} />
            <div aria-hidden className="how-floor mt-6 h-6 w-56 rounded-[50%]" />
            <p className="mt-5 text-center text-sm font-medium text-zinc-300">{STEPS[active]?.caption}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  aria-label={step.title}
                  onClick={() => scrollToStep(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none",
                    active === index ? "w-8 bg-brand" : "w-3 bg-white/15 hover:bg-white/30",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
