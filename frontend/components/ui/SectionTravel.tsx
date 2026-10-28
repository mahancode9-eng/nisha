"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TravelOptions = {
  /** Kept for call-site compatibility; no longer drives orb visuals. */
  state?: string;
  label?: string;
  durationMs?: number;
};

type SectionTravelContextValue = {
  /** Brief top progress bar, then run `action` (e.g. scroll / filter). */
  travelTo: (action: () => void, options?: TravelOptions) => void;
  isTraveling: boolean;
};

const SectionTravelContext = createContext<SectionTravelContextValue | null>(null);

export function SectionTravelProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<{ label: string } | null>(null);
  const [barWide, setBarWide] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const travelTo = useCallback(
    (action: () => void, options?: TravelOptions) => {
      clearTimers();
      const label = options?.label ?? "داره بارگذاری می‌شه…";
      // Short beat so the bar is visible, without blocking like a full-screen modal.
      const durationMs = options?.durationMs ?? 180;

      setActive({ label });
      setBarWide(false);
      // Next frame → widen the bar (indeterminate progress feel).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setBarWide(true));
      });

      timerRef.current = setTimeout(() => {
        action();
        timerRef.current = setTimeout(() => {
          setActive(null);
          setBarWide(false);
          timerRef.current = null;
        }, 120);
      }, durationMs);
    },
    [clearTimers],
  );

  const value = useMemo(
    () => ({ travelTo, isTraveling: active !== null }),
    [travelTo, active],
  );

  return (
    <SectionTravelContext.Provider value={value}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[80] h-[2px] overflow-hidden transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
        role="status"
        aria-live="polite"
        aria-label={active?.label ?? "داره بارگذاری می‌شه"}
        aria-hidden={!active}
      >
        <div
          className={cn(
            "h-full w-full origin-right bg-brand transition-transform duration-300 ease-out",
            barWide ? "scale-x-100" : "scale-x-0",
          )}
        />
      </div>
    </SectionTravelContext.Provider>
  );
}

export function useSectionTravel() {
  const ctx = useContext(SectionTravelContext);
  if (!ctx) {
    throw new Error("useSectionTravel must be used within SectionTravelProvider");
  }
  return ctx;
}
