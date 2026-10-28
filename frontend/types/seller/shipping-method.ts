export type ShippingMethod = {
  id: number;
  store_id: number;
  name: string;
  cost: string;
  eta_label: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ShippingMethodCreate = {
  name: string;
  cost?: number | string;
  eta_label?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type ShippingMethodUpdate = {
  name?: string;
  cost?: number | string;
  eta_label?: string | null;
  is_active?: boolean;
  sort_order?: number;
};
