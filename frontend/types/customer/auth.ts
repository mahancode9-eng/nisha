export type Customer = {
  id: number;
  email: string | null;
  phone: string | null;
  postal_code: string | null;
  full_name: string;
};

export type CustomerRegisterRequest = {
  email?: string;
  phone?: string;
  postal_code?: string;
  password: string;
  full_name: string;
};

export type CustomerLoginRequest = {
  login: string;
  password: string;
};

export type CustomerTokenResponse = {
  access_token?: string | null;
  token_type: string;
  customer?: Customer | null;
  needs_email_verification?: boolean;
  email?: string | null;
};

export type CustomerRegisterResult =
  | { status: "authenticated"; customer: Customer }
  | { status: "verification_required"; email: string };
