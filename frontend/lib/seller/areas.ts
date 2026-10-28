import type { StoreRole } from "@/types/seller/team";

// Mirrors AREA_ROLES in backend/app/services/team_service.py.
export type SellerArea =
  | "dashboard"
  | "orders"
  | "customers"
  | "conversations"
  | "products"
  | "store"
  | "payments"
  | "discounts"
  | "analytics"
  | "team"
  | "domain"
  | "subscription";

const AREA_ROLES: Record<Exclude<SellerArea, "subscription">, StoreRole[]> = {
  dashboard: ["owner", "order_manager", "product_manager"],
  orders: ["owner", "order_manager"],
  customers: ["owner", "order_manager"],
  conversations: ["owner", "order_manager"],
  products: ["owner", "product_manager"],
  store: ["owner"],
  payments: ["owner"],
  discounts: ["owner"],
  analytics: ["owner"],
  team: ["owner"],
  domain: ["owner"],
};

export function canUseArea(area: SellerArea, role: StoreRole, isStoreOwner: boolean): boolean {
  // Billing stays with the account that owns the store.
  if (area === "subscription") return isStoreOwner;
  if (isStoreOwner) return true;
  return AREA_ROLES[area].includes(role);
}

const PATH_AREAS: [string, SellerArea][] = [
  ["/seller/dashboard", "dashboard"],
  ["/seller/analytics", "analytics"],
  ["/seller/reports", "analytics"],
  ["/seller/products", "products"],
  ["/seller/orders", "orders"],
  ["/seller/discounts", "discounts"],
  ["/seller/conversations", "conversations"],
  ["/seller/customers", "customers"],
  ["/seller/store", "store"],
  ["/seller/payment-methods", "payments"],
  ["/seller/subscription", "subscription"],
  ["/seller/team", "team"],
  ["/seller/domain", "domain"],
];

export function areaForPath(pathname: string): SellerArea | null {
  const hit = PATH_AREAS.find(([base]) => pathname === base || pathname.startsWith(`${base}/`));
  return hit ? hit[1] : null;
}

export const ROLE_LABELS: Record<StoreRole, string> = {
  owner: "مالک",
  order_manager: "مدیر سفارش‌ها",
  product_manager: "مدیر محصولات",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as StoreRole] ?? role;
}
