"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/cn";

/**
 * Panel backgrounds:
 * - saas: landing-style zinc + violet/pink blooms + dot grid
 * - glass: soft mesh orbs (light/dark variants via CSS)
 */
export function PanelAtmosphere({ className }: { className?: string }) {
  const { activeDesignStyle, resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  if (activeDesignStyle === "glass") {
    return (
      <div className={cn("vui-atmosphere", className)} aria-hidden>
        <div className="vui-atmosphere__orb vui-atmosphere__orb--a" />
        <div className="vui-atmosphere__orb vui-atmosphere__orb--b" />
        <div className="vui-atmosphere__orb vui-atmosphere__orb--c" />
        <div className="vui-atmosphere__grid" />
      </div>
    );
  }

  if (activeDesignStyle !== "saas") {
    return null;
  }

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          isLight ? "bg-[#fafafa]" : "bg-[#09090b]",
        )}
      />

      <div
        className={cn(
          "absolute left-1/2 top-[-12%] h-[52vh] w-[90vw] -translate-x-1/2 rounded-full blur-2xl",
          isLight
            ? "bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.22)_0%,transparent_68%)]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.28)_0%,transparent_68%)]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[-20%] left-[-10%] h-[45vh] w-[55vw] rounded-full blur-3xl",
          isLight
            ? "bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.14)_0%,transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12)_0%,transparent_70%)]",
        )}
      />
      <div
        className={cn(
          "absolute bottom-[10%] right-[-15%] h-[40vh] w-[45vw] rounded-full blur-3xl",
          isLight
            ? "bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]",
        )}
      />

      <div
        className={cn("absolute inset-0", isLight ? "opacity-[0.45]" : "opacity-[0.35]")}
        style={{
          backgroundImage: isLight
            ? "radial-gradient(rgba(24,24,27,0.12) 1px, transparent 1px)"
            : "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      <div
        className={cn(
          "absolute inset-0",
          isLight
            ? "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(250,250,250,0.55)_100%)]"
            : "bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,11,0.55)_100%)]",
        )}
      />
    </div>
  );
}
