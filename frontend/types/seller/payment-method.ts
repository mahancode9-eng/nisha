export type PaymentMethodType = "CARD_TO_CARD" | "CRYPTO" | "EXTERNAL_GATEWAY";

export type PaymentMethod = {
  id: number;
  store_id: number;
  type: PaymentMethodType;
  display_name: string;
  card_number: string | null;
  wallet_address: string | null;
  external_url: string | null;
  owner_name: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodCreate = {
  type: PaymentMethodType;
  display_name: string;
  card_number?: string | null;
  wallet_address?: string | null;
  external_url?: string | null;
  owner_name?: string | null;
  instructions?: string | null;
  is_active?: boolean;
};

export type PaymentMethodUpdate = {
  type?: PaymentMethodType;
  display_name?: string;
  card_number?: string | null;
  wallet_address?: string | null;
  external_url?: string | null;
  owner_name?: string | null;
  instructions?: string | null;
  is_active?: boolean;
};
