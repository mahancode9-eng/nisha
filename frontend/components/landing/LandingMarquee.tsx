"use client";

import { useEffect, useRef } from "react";

const STORES = [
  "آتیه استور",
  "چرم نوژان",
  "خانه نور",
  "کافه دانه",
  "گالری خط",
  "بازار کوچک",
  "گلخانه میم",
  "ساعت‌خانه",
];

function LogoRow() {
  return (
    <div className="flex shrink-0 items-center gap-10 pe-10 sm:gap-14 sm:pe-14">
      {STORES.map((name) => (
        <span
          key={name}
          className="whitespace-nowrap text-sm font-semibold tracking-tight text-zinc-500 transition-colors hover:text-zinc-300 sm:text-base"
          dir="rtl"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export function LandingMarquee() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;

    const syncShift = () => {
      track.style.setProperty("--marquee-shift", `${group.offsetWidth}px`);
    };

    syncShift();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncShift) : null;
    observer?.observe(group);
    window.addEventListener("resize", syncShift);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncShift);
    };
  }, []);

  return (
    <section className="landing-marquee space-y-5 py-2" aria-label="نمونه ویترین‌ها">
      <p className="text-center text-xs font-medium tracking-[0.2em] text-zinc-500 sm:text-sm">
        چند تا فروشگاه روی نیشا
      </p>
      <div className="landing-marquee-mask relative overflow-hidden">
        <div ref={trackRef} className="landing-marquee-track flex w-max">
          <div ref={groupRef}>
            <LogoRow />
          </div>
          <div aria-hidden>
            <LogoRow />
          </div>
        </div>
      </div>
    </section>
  );
}
