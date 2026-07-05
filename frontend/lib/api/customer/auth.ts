import { customerApiGet, customerApiPost } from "@/lib/api/customer-client";
import type {
  Customer,
  CustomerLoginRequest,
  CustomerRegisterRequest,
  CustomerTokenResponse,
} from "@/types/customer/auth";

export function register(body: CustomerRegisterRequest): Promise<CustomerTokenResponse> {
  return customerApiPost<CustomerTokenResponse>("/api/v1/customer/register", body, {
    auth: false,
  });
}

export function login(body: CustomerLoginRequest): Promise<CustomerTokenResponse> {
  return customerApiPost<CustomerTokenResponse>("/api/v1/customer/login", body, {
    auth: false,
  });
}

export function getMe(): Promise<Customer> {
  return customerApiGet<Customer>("/api/v1/customer/me");
}
