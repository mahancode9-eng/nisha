import { apiGet, apiPost } from "@/lib/api/client";
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "@/types/auth";

export function login(payload: LoginRequest): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/v1/auth/login", payload, { auth: false });
}

export function register(payload: RegisterRequest): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/v1/auth/register", payload, { auth: false });
}

export function getCurrentUser(): Promise<User> {
  return apiGet<User>("/api/v1/auth/me");
}
