"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion, useInView } from "@/components/landing/useInView";

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);

const STEPS = [
  {
    title: "سفارش",
    caption: "سبد رو پر می‌کنه و ثبت می‌کنه",
    icon: icon(<><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>),
  },
  {
    title: "واریز",
    caption: "به کارت تو می‌زنه",
    icon: icon(<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>),
  },
  {
    title: "رسید",
    caption: "عکس رسید رو می‌فرسته",
    icon: icon(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>),
  },
  {
    title: "تایید تو",
    caption: "یک دکمه؛ پرداخت تایید می‌شه",
    icon: icon(<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.7 2.7L16 9.8" /></>),
  },
];

const STEP_MS = 1400;

/** Card-to-card checkout, step by step: each stage lights up in turn while the line fills. */
export function PaymentFlow() {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setActive(STEPS.length - 1);
      return;
    }
    setActive(0);
    const timer = window.setInterval(() => {
      // Hold on the last step for a beat, then replay.
      setActive((current) => (current >= STEPS.length + 1 ? 0 : current + 1));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [inView]);

  const lit = Math.min(active, STEPS.length - 1);
  const fill = lit <= 0 ? 0 : lit / (STEPS.length - 1);

  return (
    <div ref={ref} className="landing-surface relative overflow-hidden p-5 sm:p-8">
      <div className="relative">
        {/* Track: horizontal on wide screens, vertical on phones */}
        <div aria-hidden className="absolute bottom-6 start-6 top-6 w-px bg-white/10 md:inset-x-[12.5%] md:bottom-auto md:top-6 md:h-px md:w-auto" />
        <div
          aria-hidden
          className="landing-flow-fill absolute start-6 top-6 w-px bg-gradient-to-b from-violet-400 to-fuchsia-400 transition-[height,width] duration-700 ease-out md:start-[12.5%] md:h-px md:bg-gradient-to-l"
          style={{ "--flow": fill } as CSSProperties}
        />

        <ol className="relative grid gap-6 md:grid-cols-4 md:gap-4">
          {STEPS.map((step, index) => {
            const on = index <= lit;
            return (
              <li key={step.title} className="flex items-start gap-4 md:flex-col md:items-center md:text-center">
                <span
                  className={cn(
                    "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500",
                    on
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.45)]"
                      : "border-white/10 bg-[#111113] text-zinc-500",
                    index === lit && "scale-110",
                  )}
                >
                  {index === lit && (
                    <span className="absolute inset-0 animate-ping rounded-2xl border border-violet-400/40 motion-reduce:hidden" />
                  )}
                  {step.icon}
                </span>
                <span className="min-w-0 pt-1 md:pt-0">
                  <span className={cn("block font-semibold transition-colors duration-500", on ? "text-white" : "text-zinc-400")}>
                    {step.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-zinc-500">{step.caption}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
