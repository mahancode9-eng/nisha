const ACTIVE_STORE_KEY = "nisha.seller.storeId";

/** The store a seller is working in (an invited staff member may have several). */
export function getActiveStoreId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_STORE_KEY);
    const id = raw ? Number(raw) : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function setActiveStoreId(id: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_STORE_KEY, String(id));
  } catch {
    // storage unavailable; the seller's own store is used
  }
}

export function clearActiveStoreId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_STORE_KEY);
  } catch {
    // ignore
  }
}
