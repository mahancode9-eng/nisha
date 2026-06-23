import type { Customer } from "@/types/customer/auth";

export type CustomerProfile = Customer;

export type CustomerProfileUpdateRequest = {
  email?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  full_name?: string | null;
};

export type CustomerAddress = {
  id: number;
  label: string | null;
  recipient_name: string;
  recipient_phone: string;
  postal_code: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerAddressCreateRequest = {
  label?: string | null;
  recipient_name: string;
  recipient_phone: string;
  postal_code?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  is_default?: boolean;
};

export type CustomerAddressUpdateRequest = {
  label?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  postal_code?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  is_default?: boolean | null;
};
