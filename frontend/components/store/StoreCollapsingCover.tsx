"use client";

import { useEffect, useState, type ReactNode } from "react";
import { trustBadgeLabel } from "@/lib/store/badges";

const COVER_COLLAPSE_RANGE = 120;

type StoreCollapsingCoverProps = {
  storeName: string;
  coverUrl: string | null;
  logoUrl?: string | null;
  description?: string | null;
  ratingText: string;
  reviewCount: number;
  trustBadges?: string[];
  onOpenReviews?: () => void;
  onOpenAbout?: () => void;
  /** Actions rendered outside the cover image (e.g. chat icon). */
  trailingAction?: ReactNode;
};

function useScrollCollapse(range: number) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setProgress(Math.min(1, Math.max(0, y / range)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [range]);

  return progress;
}

function CoverActionButton({
  label,
  onClick,
  badge,
  children,
}: {
  label: string;
  onClick: () => void;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-md transition hover:bg-black/60 sm:h-10 sm:w-auto sm:gap-2 sm:px-3.5"
    >
      {children}
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
      {badge != null && badge > 0 ? (
        <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground sm:static sm:ms-0.5">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

/** Cover banner with overlapping store logo, name, and description. */
export function StoreCollapsingCover({
  storeName,
  coverUrl,
  logoUrl = null,
  description,
  ratingText,
  reviewCount,
  trustBadges = [],
  onOpenReviews,
  onOpenAbout,
  trailingAction,
}: StoreCollapsingCoverProps) {
  const progress = useScrollCollapse(COVER_COLLAPSE_RANGE);
  const coverOpacity = 1 - progress * 0.35;
  const coverScale = 1 + progress * 0.04;
  const initial = storeName.trim().charAt(0).toUpperCase() || "ن";

  return (
    <div className="relative">
      <div
        className="relative -mx-2.5 overflow-hidden rounded-xl sm:-mx-0 sm:rounded-2xl h-[160px] sm:h-[200px]"
      >
        <div
          className="absolute inset-0 origin-center will-change-transform"
          style={{
            opacity: coverOpacity,
            transform: `scale(${coverScale})`,
          }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(ellipse 90% 80% at 20% 20%, color-mix(in srgb, var(--store-primary, var(--brand)) 42%, transparent), transparent 55%), radial-gradient(ellipse 70% 70% at 90% 80%, color-mix(in srgb, var(--brand) 28%, transparent), transparent 50%), linear-gradient(135deg, var(--surface-muted), var(--background))",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        {(onOpenReviews || onOpenAbout) && (
          <div className="absolute left-2.5 top-2.5 z-[2] flex items-center gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
            {onOpenReviews ? (
              <CoverActionButton label="نظرات" onClick={onOpenReviews} badge={reviewCount}>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden>
                  <path
                    d="M5.5 18.5 4 21l3.2-1.2A8.5 8.5 0 1 0 5.5 18.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </CoverActionButton>
            ) : null}
            {onOpenAbout ? (
              <CoverActionButton label="درباره" onClick={onOpenAbout}>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden>
                  <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="8" r="1.1" fill="currentColor" />
                </svg>
              </CoverActionButton>
            ) : null}
          </div>
        )}
      </div>

      <div className="relative z-[1] -mt-10 flex items-end gap-2.5 px-0.5 sm:-mt-14 sm:gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-background bg-surface shadow-lg sm:h-24 sm:w-24">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-muted text-xl font-semibold text-brand sm:text-3xl">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pb-0.5 sm:pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-2xl">
              {storeName}
            </h1>
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="shrink-0 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand sm:text-xs"
              >
                {trustBadgeLabel(badge)}
              </span>
            ))}
          </div>
          <p className="mt-0.5 text-xs text-foreground-muted sm:text-sm">
            <span className="font-medium text-foreground">★ {ratingText}</span>
            {reviewCount > 0 ? (
              <span className="ms-1.5">· {reviewCount} نظر</span>
            ) : null}
          </p>
        </div>
        {trailingAction ? (
          <div className="mb-0.5 shrink-0 translate-y-3 sm:translate-y-6">{trailingAction}</div>
        ) : null}
      </div>

      {description ? (
        <p className="mt-2.5 line-clamp-2 px-0.5 text-xs leading-5 text-foreground-muted sm:mt-3 sm:text-sm sm:leading-6">
          {description}
        </p>
      ) : null}
    </div>
  );
}
