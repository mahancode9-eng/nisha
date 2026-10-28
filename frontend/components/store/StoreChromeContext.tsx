"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PublicProductCategory } from "@/types/public/store";

type StoreChromeActions = {
  openReviews: () => void;
  openAbout: () => void;
  selectCategory: (slug: string | null) => void;
};

type StoreChromeContextValue = {
  reviewCount: number;
  setReviewCount: (count: number) => void;
  categories: PublicProductCategory[];
  setCategories: (categories: PublicProductCategory[]) => void;
  activeCategorySlug: string | null;
  setActiveCategorySlug: (slug: string | null) => void;
  registerActions: (actions: Partial<StoreChromeActions>) => void;
  openReviews: () => void;
  openAbout: () => void;
  selectCategory: (slug: string | null) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

const StoreChromeContext = createContext<StoreChromeContextValue | null>(null);

export function StoreChromeProvider({ children }: { children: ReactNode }) {
  const [reviewCount, setReviewCount] = useState(0);
  const [categories, setCategories] = useState<PublicProductCategory[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actions, setActions] = useState<StoreChromeActions>({
    openReviews: () => {
      document.getElementById("store-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    openAbout: () => {},
    selectCategory: () => {},
  });

  const registerActions = useCallback((next: Partial<StoreChromeActions>) => {
    setActions((prev) => ({ ...prev, ...next }));
  }, []);

  const value = useMemo(
    () => ({
      reviewCount,
      setReviewCount,
      categories,
      setCategories,
      activeCategorySlug,
      setActiveCategorySlug,
      registerActions,
      openReviews: actions.openReviews,
      openAbout: actions.openAbout,
      selectCategory: actions.selectCategory,
      menuOpen,
      setMenuOpen,
    }),
    [
      reviewCount,
      categories,
      activeCategorySlug,
      registerActions,
      actions,
      menuOpen,
    ],
  );

  return <StoreChromeContext.Provider value={value}>{children}</StoreChromeContext.Provider>;
}

export function useStoreChrome() {
  const ctx = useContext(StoreChromeContext);
  if (!ctx) {
    throw new Error("useStoreChrome must be used within StoreChromeProvider");
  }
  return ctx;
}
