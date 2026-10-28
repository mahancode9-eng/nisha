"use client";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/** Legacy orb state names — accepted but unused so call sites keep compiling. */
export type OrbState =
  | "breathing"
  | "connecting"
  | "searching"
  | "weaving"
  | "thinking"
  | string;

type OrbLoaderProps = {
  state?: OrbState;
  size?: 20 | 64;
  speed?: number;
  className?: string;
  label?: string;
};

/**
 * Back-compat loading indicator. Renders a standard spinner
 * (replaces the previous ThinkingOrb visual).
 */
export function OrbLoader({ size = 64, className, label }: OrbLoaderProps) {
  return (
    <Spinner
      size={size === 20 ? "sm" : "lg"}
      label={label}
      className={cn(className)}
    />
  );
}
