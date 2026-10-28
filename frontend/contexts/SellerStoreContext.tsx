"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ROLE_FORBIDDEN_EVENT } from "@/lib/api/client";
import * as teamApi from "@/lib/api/seller/team";
import { clearActiveStoreId, getActiveStoreId, setActiveStoreId } from "@/lib/auth/active-store";
import { paths } from "@/lib/auth/paths";
import { areaForPath, canUseArea, type SellerArea } from "@/lib/seller/areas";
import type { MyStore } from "@/types/seller/team";

type SellerStoreContextValue = {
  stores: MyStore[];
  /** The store the panel is acting on; null until the list loads. */
  activeStore: MyStore | null;
  isReady: boolean;
  can: (area: SellerArea) => boolean;
  /** The current page was refused for this role (by path or by a 403 from the API). */
  forbidden: boolean;
  switchStore: (storeId: number) => void;
};

const SellerStoreContext = createContext<SellerStoreContextValue | null>(null);

export function SellerStoreProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [stores, setStores] = useState<MyStore[]>([]);
  const [activeStore, setActiveStore] = useState<MyStore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [apiForbidden, setApiForbidden] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    teamApi
      .listMyStores()
      .then((list) => {
        if (cancelled) return;
        const stored = getActiveStoreId();
        let active = list.find((s) => s.store_id === stored) ?? null;
        if (!active) {
          // The saved store is gone (or never set): back to the user's own store.
          clearActiveStoreId();
          active = list.find((s) => s.is_store_owner) ?? null;
          if (!active && list.length > 0) {
            active = list[0];
            setActiveStoreId(active.store_id);
          }
        }
        setStores(list);
        setActiveStore(active);
      })
      .catch(() => {
        // Without the list the panel acts as the account's own store.
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onForbidden = () => setApiForbidden(pathname);
    window.addEventListener(ROLE_FORBIDDEN_EVENT, onForbidden);
    return () => window.removeEventListener(ROLE_FORBIDDEN_EVENT, onForbidden);
  }, [pathname]);

  const can = useCallback(
    (area: SellerArea) => (activeStore ? canUseArea(area, activeStore.role, activeStore.is_store_owner) : true),
    [activeStore],
  );

  const switchStore = useCallback((storeId: number) => {
    setActiveStoreId(storeId);
    // A full load so every page refetches for the new store.
    window.location.assign(paths.seller.dashboard);
  }, []);

  const area = areaForPath(pathname);
  const forbidden = (area !== null && !can(area)) || apiForbidden === pathname;

  const value = useMemo(
    () => ({ stores, activeStore, isReady, can, forbidden, switchStore }),
    [stores, activeStore, isReady, can, forbidden, switchStore],
  );

  return <SellerStoreContext.Provider value={value}>{children}</SellerStoreContext.Provider>;
}

export function useSellerStore(): SellerStoreContextValue {
  const ctx = useContext(SellerStoreContext);
  if (!ctx) {
    throw new Error("useSellerStore must be used within SellerStoreProvider");
  }
  return ctx;
}
