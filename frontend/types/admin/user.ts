import type { UserRole } from "@/types/auth";

export type AdminUserListItem = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  store_slug: string | null;
  created_at: string;
};

export type AdminUserDetail = AdminUserListItem & {
  email_verified_at: string | null;
};

export type AdminUserUpdate = {
  full_name?: string;
  is_active?: boolean;
  role?: UserRole;
};

export type AdminSetPasswordRequest = {
  password: string;
};

export type AdminCustomerListItem = {
  id: number;
  email: string | null;
  phone: string | null;
  full_name: string;
  order_count: number;
  email_verified_at: string | null;
  created_at: string;
};

export type AdminCustomerDetail = AdminCustomerListItem & {
  postal_code: string | null;
};

export type AdminCustomerUpdate = {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
};
