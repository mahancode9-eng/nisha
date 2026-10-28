"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStoreChrome } from "@/components/store/StoreChromeContext";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useSectionTravel } from "@/components/ui/SectionTravel";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import type { PublicProductCategory } from "@/types/public/store";

const MORE_LINKS = [
  { href: paths.trackOrder, label: "پیگیری سفارش", hint: "با کد و رمز فاکتور" },
  { href: paths.terms, label: "قوانین" },
  { href: paths.privacy, label: "حریم خصوصی" },
  { href: paths.complaintsPolicy, label: "ثبت شکایت" },
] as const;

type CategoryNode = PublicProductCategory & { children: PublicProductCategory[] };

function buildCategoryTree(categories: PublicProductCategory[]): CategoryNode[] {
  const roots = categories.filter((c) => !c.parent_id);
  return roots.map((root) => ({
    ...root,
    children: categories.filter((c) => c.parent_id === root.id),
  }));
}

type StoreHamburgerMenuProps = {
  open: boolean;
  onClose: () => void;
  storeName: string;
};

export function StoreHamburgerMenu({ open, onClose, storeName }: StoreHamburgerMenuProps) {
  const {
    categories,
    activeCategorySlug,
    selectCategory,
    openAbout,
    openReviews,
    reviewCount,
  } = useStoreChrome();
  const { travelTo } = useSectionTravel();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = categories.find((c) => c.slug === activeCategorySlug);
    if (active?.parent_id) setExpandedId(active.parent_id);
  }, [open, activeCategorySlug, categories]);

  function pickCategory(slug: string | null) {
    onClose();
    travelTo(() => {
      selectCategory(slug);
      document.getElementById("store-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-[60] bg-black/45 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="بستن منو"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="منوی فروشگاه"
        className={cn(
          "fixed inset-y-0 start-0 z-[70] flex w-[min(20rem,88vw)] flex-col border-e border-border bg-surface shadow-2xl transition-transform duration-300 ease-out sm:w-80",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{storeName}</p>
            <p className="text-xs text-foreground-muted">منو و دسته‌بندی‌ها</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
            aria-label="بستن"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
            دسته‌بندی‌ها
          </p>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => pickCategory(null)}
                className={cn(
                  "flex w-full items-center rounded-xl px-3 py-2.5 text-start text-sm transition",
                  !activeCategorySlug
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-foreground hover:bg-surface-muted",
                )}
              >
                همه محصول‌ها
              </button>
            </li>
            {tree.length === 0 ? (
              <li className="px-3 py-2 text-xs text-foreground-muted">این فروشگاه هنوز دسته‌بندی نداره.</li>
            ) : (
              tree.map((node) => {
                const hasChildren = node.children.length > 0;
                const expanded = expandedId === node.id;
                const active =
                  activeCategorySlug === node.slug ||
                  node.children.some((c) => c.slug === activeCategorySlug);

                return (
                  <li key={node.id}>
                    <div className="flex items-stretch gap-0.5">
                      <button
                        type="button"
                        onClick={() => pickCategory(node.slug)}
                        className={cn(
                          "min-w-0 flex-1 rounded-xl px-3 py-2.5 text-start text-sm transition",
                          activeCategorySlug === node.slug
                            ? "bg-brand/10 font-medium text-brand"
                            : active
                              ? "text-foreground"
                              : "text-foreground hover:bg-surface-muted",
                        )}
                      >
                        {node.name}
                      </button>
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : node.id)}
                          className="rounded-xl px-2 text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
                          aria-expanded={expanded}
                          aria-label={expanded ? "بستن زیردسته‌ها" : "نمایش زیردسته‌ها"}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className={cn("h-4 w-4 transition", expanded && "rotate-180")}
                            aria-hidden
                          >
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                    {hasChildren && expanded ? (
                      <ul className="ms-3 space-y-0.5 border-s border-border/70 ps-2 py-0.5">
                        {node.children.map((child) => (
                          <li key={child.id}>
                            <button
                              type="button"
                              onClick={() => pickCategory(child.slug)}
                              className={cn(
                                "w-full rounded-xl px-3 py-2 text-start text-sm transition",
                                activeCategorySlug === child.slug
                                  ? "bg-brand/10 font-medium text-brand"
                                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                              )}
                            >
                              {child.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>

          <div className="my-3 border-t border-border/70" />

          <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
            فروشگاه
          </p>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAbout();
                }}
                className="flex w-full items-center rounded-xl px-3 py-2.5 text-start text-sm text-foreground transition hover:bg-surface-muted"
              >
                درباره فروشگاه
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openReviews();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm text-foreground transition hover:bg-surface-muted"
              >
                <span>نظرات</span>
                {reviewCount > 0 ? (
                  <span className="text-xs text-foreground-muted">{reviewCount}</span>
                ) : null}
              </button>
            </li>
            {MORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-surface-muted"
                >
                  <span>{link.label}</span>
                  {"hint" in link && link.hint ? (
                    <span className="max-w-[45%] truncate text-[11px] text-foreground-muted">{link.hint}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          <div className="my-3 border-t border-border/70" />
          <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
            ظاهر
          </p>
          <div className="px-3 pb-2">
            <ThemeSwitcher variant="group" />
          </div>

          <Link
            href={paths.home}
            onClick={onClose}
            className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            میزبانی‌شده روی نیشا
          </Link>
        </nav>
      </div>
    </>
  );
}
