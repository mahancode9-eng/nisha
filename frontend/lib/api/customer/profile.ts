import {
  customerApiDelete,
  customerApiGet,
  customerApiPatch,
  customerApiPost,
} from "@/lib/api/customer-client";
import type {
  CustomerAddress,
  CustomerAddressCreateRequest,
  CustomerAddressUpdateRequest,
  CustomerProfile,
  CustomerProfileUpdateRequest,
} from "@/types/customer/profile";

export function getProfile(): Promise<CustomerProfile> {
  return customerApiGet<CustomerProfile>("/api/v1/customer/profile");
}

export function updateProfile(body: CustomerProfileUpdateRequest): Promise<CustomerProfile> {
  return customerApiPatch<CustomerProfile>("/api/v1/customer/profile", body);
}

export function listAddresses(): Promise<CustomerAddress[]> {
  return customerApiGet<CustomerAddress[]>("/api/v1/customer/addresses");
}

export function createAddress(body: CustomerAddressCreateRequest): Promise<CustomerAddress> {
  return customerApiPost<CustomerAddress>("/api/v1/customer/addresses", body);
}

export function updateAddress(
  id: number,
  body: CustomerAddressUpdateRequest,
): Promise<CustomerAddress> {
  return customerApiPatch<CustomerAddress>(`/api/v1/customer/addresses/${id}`, body);
}

export function deleteAddress(id: number): Promise<void> {
  return customerApiDelete<void>(`/api/v1/customer/addresses/${id}`);
}
