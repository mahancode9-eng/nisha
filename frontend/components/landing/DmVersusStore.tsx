"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/landing/Reveal";
import { toFa, useInView } from "@/components/landing/useInView";

type Message = { from: "buyer" | "seller"; text: string; time: string; receipt?: boolean; ltr?: boolean };

// One ordinary sale, the way it usually goes in an Instagram DM.
const THREAD: Message[] = [
  { from: "buyer", text: "سلام، قیمت؟", time: "۱۴:۰۲" },
  { from: "seller", text: "سلام. ۱٬۱۹۰٬۰۰۰ تومان", time: "۱۴:۱۱" },
  { from: "buyer", text: "مشکی‌اش موجوده؟", time: "۱۴:۱۲" },
  { from: "seller", text: "بله موجوده", time: "۱۴:۲۶" },
  { from: "buyer", text: "شماره کارت رو می‌فرستی؟", time: "۱۴:۲۷" },
  { from: "seller", text: "۶۰۳۷ •••• •••• ۴۲۱۸", time: "۱۴:۳۰", ltr: true },
  { from: "buyer", text: "واریز کردم، اینم رسیدش", time: "۱۴:۴۱", receipt: true },
  { from: "seller", text: "ممنون. آدرس و کد پستی رو هم بفرست", time: "۱۵:۰۵" },
  { from: "buyer", text: "کی می‌رسه؟", time: "۱۵:۰۹" },
];

const STEPS = [
  {
    title: "لینک رو باز می‌کنه",
    text: "قیمت و موجودی رو روی صفحه می‌بینه. لازم نیست بپرسه.",
  },
  {
    title: "خودش سفارش می‌ده",
    text: "اسم، شماره و آدرس رو تو فرم می‌نویسه.",
  },
  {
    title: "رسید رو همون‌جا می‌فرسته",
    text: "شماره کارت تو رو می‌بینه، واریز می‌کنه، عکس رسید رو می‌ذاره.",
  },
  {
    title: "تو تایید می‌کنی",
    text: "رسید کنار سفارشه. یک دکمه، تمام.",
  },
];

function DmThread() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);

  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-[#ddd3c4] bg-[#fffdf9] shadow-[0_1px_0_#ddd3c4,0_18px_40px_-24px_rgba(0,0,0,0.55)]",
        inView && "is-playing",
      )}
    >
      <div className="flex items-center gap-3 border-b border-[#eee7dc] px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efe6d8] text-sm font-bold text-[#6b6258]">
          م
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#1f1b17]">مشتری</span>
          <span className="block text-[11px] text-[#8a8178]">دایرکت اینستاگرام</span>
        </span>
      </div>

      <ol className="space-y-2 px-3 py-4 text-[13px] leading-6">
        {THREAD.map((message, index) => {
          const mine = message.from === "seller";
          return (
            <li
              key={index}
              className={cn("landing-bubble flex", mine ? "justify-end" : "justify-start")}
              style={{ transitionDelay: `${index * 380}ms` } as CSSProperties}
            >
              <span
                className={cn(
                  "max-w-[78%] rounded-2xl px-3 py-1.5",
                  mine ? "rounded-ee-md bg-[#1f1b17] text-[#f4f1ec]" : "rounded-es-md bg-[#efe9df] text-[#1f1b17]",
                )}
              >
                {message.receipt && (
                  <span className="mb-1.5 block rounded-lg border border-[#ddd3c4] bg-[#fffdf9] px-2.5 py-2 text-[11px] leading-5 text-[#6b6258]">
                    <span className="block font-semibold text-[#1f1b17]">رسید انتقال وجه</span>
                    ۱٬۱۹۰٬۰۰۰ تومان
                  </span>
                )}
                <span dir={message.ltr ? "ltr" : undefined} className={cn(message.ltr && "inline-block tabular-nums")}>
                  {message.text}
                </span>
                <span className={cn("ms-2 align-bottom text-[10px]", mine ? "text-white/45" : "text-[#8a8178]")}>
                  {message.time}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A real-looking DM sale next to the same sale on a Nisha store. */
export function DmVersusStore() {
  return (
    <div className="space-y-10">
      <Reveal>
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="landing-eyebrow">دایرکت یا فروشگاه</p>
          <h2 className="landing-display text-3xl text-white sm:text-4xl lg:text-5xl">
            فروش تو دایرکت معمولاً این شکلیه
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            {toFa(THREAD.length)} پیام و یک ساعت رفت‌وبرگشت برای یک کیف، هنوز هم آدرس نرسیده. توی نیشا
            همین سفارش بدون این چت‌ها ثبت می‌شه.
          </p>
        </div>
      </Reveal>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
        <DmThread />

        <div>
          <p className="text-sm font-semibold text-violet-300">همین کار در نیشا</p>
          <ol className="mt-6 space-y-7">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 90} className="flex gap-4">
                  <span className="w-7 shrink-0 text-2xl font-extrabold leading-none text-violet-400">
                    {toFa(index + 1)}
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-white">{step.title}</span>
                    <span className="mt-1.5 block text-sm leading-7 text-zinc-400">{step.text}</span>
                  </span>
                </Reveal>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-t border-white/10 pt-5 text-sm leading-7 text-zinc-400">
            سفارش و رسید تو پنل یک‌جاست. دیگه لای چت‌ها دنبالشون نگرد.
          </p>
        </div>
      </div>
    </div>
  );
}
