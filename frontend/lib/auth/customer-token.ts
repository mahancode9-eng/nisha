import type { Customer } from "@/types/customer/auth";

const TOKEN_KEY = "nisha_customer_token";
const CUSTOMER_KEY = "nisha_customer";

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCustomerToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCustomerToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}

export function getStoredCustomer(): Customer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CUSTOMER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Customer;
  } catch {
    return null;
  }
}

export function setStoredCustomer(customer: Customer): void {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}
