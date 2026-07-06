export type DiscountType = "PERCENT" | "FIXED";

export type DiscountCode = {
  id: number;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  percent_off: string | null;
  amount_off: string | null;
  min_order_amount: string | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type DiscountCodeCreate = {
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  percent_off?: string | number | null;
  amount_off?: string | number | null;
  min_order_amount?: string | number | null;
  max_uses?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
};

export type DiscountCodeUpdate = Partial<DiscountCodeCreate>;
