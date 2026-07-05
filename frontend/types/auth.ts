export type UserRole = "ADMIN" | "SELLER";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  store_slug: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name: string;
};
