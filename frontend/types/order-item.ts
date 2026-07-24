export type OrderItemFieldValue = {
  field_key: string;
  field_label: string;
  field_type: string;
  sort_order: number;
  value_text: string | null;
  value_json: unknown;
  file_url: string | null;
  field_snapshot?: Record<string, unknown> | null;
};

export type OrderLineItem = {
  id?: number | null;
  product_id?: number | null;
  variant_id?: number | null;
  variant_name_snapshot?: string | null;
  variant_name?: string | null;
  product_title_snapshot?: string;
  product_title?: string;
  unit_price_snapshot?: string;
  unit_price?: string;
  quantity: number;
  total_price: string;
  field_values?: OrderItemFieldValue[];
};
