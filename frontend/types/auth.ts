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
  access_token?: string | null;
  refresh_token?: string | null;
  token_type: string;
  user?: User | null;
  needs_email_verification?: boolean;
  email?: string | null;
};

export type RegisterResult =
  | { status: "authenticated"; user: User }
  | { status: "verification_required"; email: string };

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name: string;
};
