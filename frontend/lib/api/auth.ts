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

export function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  return apiPost<TokenResponse>(
    "/api/v1/auth/google",
    { id_token: idToken },
    { auth: false },
  );
}

export function register(payload: RegisterRequest): Promise<TokenResponse> {
  return apiPost<TokenResponse>("/api/v1/auth/register", payload, { auth: false });
}

export function getCurrentUser(): Promise<User> {
  return apiGet<User>("/api/v1/auth/me");
}

export function refresh(refreshToken: string): Promise<TokenResponse> {
  return apiPost<TokenResponse>(
    "/api/v1/auth/refresh",
    { refresh_token: refreshToken },
    { auth: false },
  );
}

export function changePassword(payload: {
  current_password?: string | null;
  new_password: string;
}): Promise<{ message: string }> {
  return apiPost<{ message: string }>("/api/v1/auth/change-password", payload);
}
