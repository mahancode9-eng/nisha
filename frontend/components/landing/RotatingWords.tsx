"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function RotatingWords({
  words,
  intervalMs = 2600,
  className,
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let swapTimer = 0;
    const timer = window.setInterval(() => {
      setLeaving(true);
      swapTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setLeaving(false);
      }, 280);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(swapTimer);
    };
  }, [words.length, intervalMs]);

  // Invisible copies reserve the widest word so neighbors don't shift.
  return (
    <span className="relative inline-grid max-w-full align-baseline text-center">
      {words.map((word) => (
        <span
          key={word}
          className="invisible col-start-1 row-start-1 whitespace-nowrap px-1"
          aria-hidden
        >
          <span className={className}>{word}</span>
        </span>
      ))}
      <span
        className={cn(
          "col-start-1 row-start-1 whitespace-nowrap px-1 transition-all duration-300 ease-out motion-reduce:transition-none",
          leaving ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <span className={className}>{words[index]}</span>
      </span>
    </span>
  );
}
