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

    const timer = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIndex((current) => (current + 1) % words.length);
        setLeaving(false);
      }, 260);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [words.length, intervalMs]);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-300 ease-out motion-reduce:transition-none",
        leaving ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100",
        className,
      )}
    >
      {words[index]}
    </span>
  );
}
