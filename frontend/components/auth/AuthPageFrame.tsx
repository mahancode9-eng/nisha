import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/layout/chrome/BrandMark";
import { ThemeModeToggle } from "@/components/theme/GlobalThemeToggle";
import { paths } from "@/lib/auth/paths";

/** Shared auth chrome — landing-matched atmosphere for login/register/recover. */
export function AuthPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-20%] h-[50vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.22),transparent_70%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse at center, black 15%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 15%, transparent 70%)",
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 pt-6">
        <BrandMark />
        <div className="flex items-center gap-2">
          <ThemeModeToggle />
          <Link
            href={paths.home}
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            برگرد خونه
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
