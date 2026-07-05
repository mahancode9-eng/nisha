"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LandingShell } from "@/components/layout/LandingShell";
import { PublicShell } from "@/components/layout/PublicShell";
import { paths } from "@/lib/auth/paths";

type PublicRouteFrameProps = {
  children: ReactNode;
};

export function PublicRouteFrame({ children }: PublicRouteFrameProps) {
  const pathname = usePathname();

  if (pathname === paths.home) {
    return <LandingShell>{children}</LandingShell>;
  }

  return <PublicShell>{children}</PublicShell>;
}
