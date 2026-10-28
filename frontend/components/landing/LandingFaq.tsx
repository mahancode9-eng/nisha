"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/landing/Reveal";

const FAQS = [
  {
    q: "نیشا رایگانه؟",
    a: "آره. فروشگاه می‌سازی، محصول می‌ذاری و با کارت‌به‌کارت می‌فروشی. از سفارش کارمزد نمی‌گیریم. اگر ابزار بیشتری خواستی، پلن می‌گیری.",
  },
  {
    q: "پول چطور می‌آد؟",
    a: "مشتری به کارت تو واریز می‌کنه و عکس رسید رو روی سفارش می‌فرسته. تو توی پنل تایید می‌کنی. درگاه لازم نیست.",
  },
  {
    q: "کارت بانکی لازم است؟",
    a: "آره. شماره کارت رو تو تنظیمات بذار تا مشتری بدونه کجا واریز کنه.",
  },
  {
    q: "مشتری باید حساب بسازه؟",
    a: "نه. از پلن پایه به بالا فقط با اسم و شماره تلفن سفارش می‌ده. بعد با کد و رمز فاکتور پیگیری می‌کنه.",
  },
  {
    q: "چقدر طول می‌کشه؟",
    a: "معمولاً چند دقیقه: ثبت‌نام، ساخت فروشگاه، گذاشتن محصول، فرستادن لینک.",
  },
];

export function LandingFaq() {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="space-y-10">
      <Reveal>
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="landing-eyebrow">سؤال‌های پرتکرار</p>
          <h2 className="landing-display text-3xl text-white sm:text-4xl lg:text-5xl">
            قبل از شروع معمولاً اینا رو می‌پرسن
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            جوابت اینجا نبود؟ از پشتیبانی داخل پنل بپرس.
          </p>
        </div>
      </Reveal>

      <div className="mx-auto max-w-3xl space-y-2">
        {FAQS.map((item, index) => {
          const isOpen = open === index;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;
          return (
            <Reveal key={item.q} delay={index * 40}>
              <div className="landing-surface overflow-hidden">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition-transform",
                      isOpen && "rotate-45 text-white",
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-zinc-400">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
