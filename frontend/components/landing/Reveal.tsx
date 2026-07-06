"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type RevealDirection = "up" | "left" | "right" | "none";

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    direction === "up"
      ? "translate-y-8"
      : direction === "left"
        ? "-translate-x-8"
        : direction === "right"
          ? "translate-x-8"
          : "";

  const style: CSSProperties = delay > 0 ? { transitionDelay: delay + "ms" } : undefined ?? undefined;

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
        visible ? "translate-x-0 translate-y-0 opacity-100" : cn("opacity-0", hiddenTransform),
        className,
      )}
    >
      {children}
    </div>
  );
}
