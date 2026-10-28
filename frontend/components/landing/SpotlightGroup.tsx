"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Soft glow that follows the mouse on `.landing-spotlight` cards.
 * Throttled to one paint per frame so scrolling stays smooth.
 */
export function SpotlightGroup({ children, className }: { children: ReactNode; className?: string }) {
  const frameRef = useRef(0);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const card = (event.target as HTMLElement).closest<HTMLElement>(".landing-spotlight");
    if (!card) return;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${clientX - rect.left}px`);
      card.style.setProperty("--spot-y", `${clientY - rect.top}px`);
    });
  }

  return (
    <div className={className} onPointerMove={onPointerMove}>
      {children}
    </div>
  );
}
