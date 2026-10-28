"use client";

import { useSellerStore } from "@/contexts/SellerStoreContext";
import { Select } from "@/components/ui/Select";

export function StoreSwitcher() {
  const { stores, activeStore, switchStore } = useSellerStore();
  if (stores.length < 2 || !activeStore) return null;

  return (
    <Select
      aria-label="فروشگاه فعال"
      value={activeStore.store_id}
      onChange={(event) => switchStore(Number(event.target.value))}
    >
      {stores.map((store) => (
        <option key={store.store_id} value={store.store_id}>
          {store.name}
        </option>
      ))}
    </Select>
  );
}
