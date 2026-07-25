"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Step = {
  title: string;
  description: string;
  highlights: string[];
  emoji: string;
};

const STEPS: Step[] = [
  {
    title: "فروشگاهت را بساز",
    description:
      "اسم و لوگو را می‌گذاری، لینک خودت را می‌گیری و ویترینت بالا می‌آید — بدون حتی یک خط کد.",
    highlights: ["لینک اختصاصی", "لوگو و کاور", "شروع رایگان"],
    emoji: "🏗️",
  },
  {
    title: "محصول‌ها را بچین",
    description:
      "عکس، قیمت و موجودی را اضافه کن. اگر خواستی، کد تخفیف هم بساز تا فروش اول زودتر برسد.",
    highlights: ["گالری عکس", "تنوع رنگ و سایز", "کد تخفیف"],
    emoji: "🛍️",
  },
  {
    title: "با کارت‌به‌کارت بفروش",
    description:
      "مشتری خرید می‌کند، به کارت تو واریز می‌کند و رسید را آپلود می‌کند. تو با یک نگاه تایید می‌کنی — بدون کارمزد روی سفارش.",
    highlights: ["کارت‌به‌کارت", "آپلود رسید", "چت با مشتری"],
    emoji: "💳",
  },
  {
    title: "رشدت را ببین",
    description:
      "بازدید و فروش روزانه را در داشبورد ببین تا بدانی چه چیزی واقعاً می‌فروشد.",
    highlights: ["آمار بازدید و فروش", "فاکتور", "اعلان سفارش"],
    emoji: "📈",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const items = Array.from(container.querySelectorAll("[data-step-index]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const raw = entry.target.getAttribute("data-step-index");
          const parsed = raw === null ? Number.NaN : Number(raw);
          if (!Number.isNaN(parsed)) setActive(parsed);
        }
      },
      { threshold: 0.55, rootMargin: "-10% 0px -25% 0px" },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <div className="relative h-[26rem] overflow-hidden rounded-[2rem] border border-border/70 bg-surface/85 shadow-sm">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                aria-hidden={active === index ? undefined : true}
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-6 p-10 text-center transition-all duration-500 ease-out motion-reduce:transition-none",
                  active === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
                )}
              >
                <span className="text-7xl">{step.emoji}</span>
                <p className="text-xl font-semibold text-foreground">{step.title}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {step.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2">
              {STEPS.map((step, index) => (
                <span
                  key={step.title}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    active === index ? "w-8 bg-brand" : "w-3 bg-surface-muted",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ol className="space-y-6 lg:space-y-24 lg:py-10">
        {STEPS.map((step, index) => (
          <li key={step.title} data-step-index={index}>
            <div
              className={cn(
                "rounded-[1.75rem] border p-6 transition-all duration-500 sm:p-8",
                active === index
                  ? "border-brand/40 bg-surface shadow-lg"
                  : "border-border/70 bg-surface/60 lg:opacity-60",
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-colors duration-500",
                    active === index ? "bg-brand text-brand-foreground" : "bg-surface-muted text-foreground-muted",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">{step.title}</h3>
                <span className="ms-auto text-2xl lg:hidden">{step.emoji}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground-muted sm:text-base">{step.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                {step.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
