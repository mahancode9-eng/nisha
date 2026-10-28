"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion, toFa, useInView } from "@/components/landing/useInView";

const products = [
  { name: "کفش روزمره", price: "۲٬۴۸۰٬۰۰۰", tone: "from-violet-700/50 to-zinc-800" },
  { name: "کیف چرمی", price: "۱٬۱۹۰٬۰۰۰", tone: "from-fuchsia-800/40 to-zinc-900" },
  { name: "ساعت مینیمال", price: "۳٬۲۵۰٬۰۰۰", tone: "from-indigo-700/40 to-zinc-900" },
  { name: "عطر سبک", price: "۸۹۰٬۰۰۰", tone: "from-rose-800/35 to-zinc-900" },
];

// One sale, played on a loop: quiet → order → receipt → confirmed.
const STAGES = [
  { toast: null, product: -1 },
  { toast: { title: "سفارش تازه", body: "کیف چرمی · ۱٬۱۹۰٬۰۰۰ تومان", tone: "violet" }, product: 1 },
  { toast: { title: "رسید اومد", body: "عکس واریز رو فرستاد", tone: "sky" }, product: 1 },
  { toast: { title: "تایید شد", body: "می‌تونی بفرستی", tone: "emerald" }, product: -1 },
] as const;

const toneClasses = {
  violet: "bg-violet-400",
  sky: "bg-sky-400",
  emerald: "bg-emerald-400",
};

const STAGE_MS = 2600;

/** Counts up from zero the first time `start` turns true, then follows `target` directly. */
function useCountUp(target: number, start: boolean, duration = 1200) {
  const [value, setValue] = useState(target);
  const played = useRef(false);
  useEffect(() => {
    if (!start) return;
    if (played.current || prefersReducedMotion()) {
      setValue(target);
      return;
    }
    played.current = true;
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setValue(target);
    };
  }, [target, start, duration]);
  return value;
}

type LandingMockupProps = {
  className?: string;
};

/** Wide product preview for the hero: a small dashboard that plays one card-to-card sale. */
export function LandingMockup({ className }: LandingMockupProps) {
  const [viewRef, inView] = useInView<HTMLDivElement>(0.25);
  const [stage, setStage] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setStage((current) => (current + 1) % STAGES.length);
    }, STAGE_MS);
    return () => window.clearInterval(timer);
  }, [inView]);

  useEffect(() => {
    if (stage === 1) setCycles((c) => c + 1);
  }, [stage]);

  // Completed sales so far, plus the one in flight.
  const done = Math.max(0, cycles - (stage === 0 ? 0 : 1));
  const orders = useCountUp(12 + done + (stage === 0 ? 0 : 1), inView);
  const pending = stage === 1 || stage === 2 ? 4 : 3;
  const revenue = useCountUp(48 + done + (stage === 3 ? 1 : 0), inView);

  const stats = [
    { label: "سفارش امروز", value: toFa(orders) },
    { label: "در انتظار تایید", value: toFa(pending) },
    { label: "فروش ماه", value: `${toFa(revenue)}م` },
  ];

  const current = STAGES[stage];

  return (
    <div ref={viewRef} className={cn("relative mx-auto w-full max-w-5xl", className)}>
      <div className="landing-glow-ring relative overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0f]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
          <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center gap-2 rounded-md border border-white/10 bg-black/30 px-3">
            <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-emerald-400/80" fill="currentColor" aria-hidden>
              <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
            </svg>
            <span className="truncate text-[11px] text-zinc-400">atieh.nishaapp.ir</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[200px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden border-e border-white/10 bg-white/[0.02] p-4 lg:block">
            <p className="mb-4 text-xs font-semibold text-white">آتیه استور</p>
            <ul className="space-y-1 text-sm text-zinc-400">
              {["داشبورد", "سفارش‌ها", "محصول‌ها", "گفتگوها", "تنظیمات"].map((item, i) => (
                <li
                  key={item}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2",
                    i === 0 ? "bg-white/10 text-white" : "hover:bg-white/[0.04]",
                  )}
                >
                  {item}
                  {i === 1 && (
                    <span
                      className={cn(
                        "rounded-full bg-violet-500 px-1.5 text-[10px] font-semibold leading-4 text-white transition-all duration-300",
                        pending > 3 ? "scale-100 opacity-100" : "scale-50 opacity-0",
                      )}
                    >
                      {toFa(1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <div className="relative p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500">فروشگاه آنلاین</p>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  ویترین زنده
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </h3>
              </div>
              <span className="rounded-md border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200">
                کارت‌به‌کارت فعال
              </span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
              {stats.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-lg border bg-white/[0.03] px-3 py-3 transition-colors duration-500",
                    index === 1 && pending > 3 ? "border-violet-400/40" : "border-white/10",
                  )}
                >
                  <p className="text-lg font-semibold tabular-nums tracking-tight text-white sm:text-xl">
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
              {products.map((product, index) => (
                <div
                  key={product.name}
                  className={cn(
                    "overflow-hidden rounded-md border bg-black/25 transition-colors duration-300",
                    current.product === index
                      ? "border-violet-400/55 bg-violet-500/5"
                      : "border-white/10",
                  )}
                >
                  <div className="relative h-12 overflow-hidden bg-gradient-to-br sm:h-14">
                    <div className={cn("absolute inset-0 bg-gradient-to-br", product.tone)} />
                  </div>
                  <div className="space-y-0.5 p-1.5 sm:p-2">
                    <p className="truncate text-[11px] font-medium text-white sm:text-xs">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">{product.price}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Notification toasts */}
            <div className="pointer-events-none absolute inset-x-3 top-3 sm:inset-x-auto sm:end-4 sm:top-4 sm:w-[17rem]">
              {STAGES.map((item, index) =>
                item.toast ? (
                  <div
                    key={item.toast.title}
                    aria-hidden
                    className={cn(
                      "landing-glass absolute inset-x-0 top-0 flex items-center gap-3 px-3 py-2.5 transition-all duration-500 ease-out",
                      stage === index ? "translate-y-0 scale-100 opacity-100" : "-translate-y-3 scale-95 opacity-0",
                    )}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", toneClasses[item.toast.tone])} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-white">{item.toast.title}</span>
                      <span className="block truncate text-[11px] text-zinc-400">{item.toast.body}</span>
                    </span>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
